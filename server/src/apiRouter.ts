import { BoardVariant, GameStatus } from '@abizzle/mafingo-core';
import express from 'express';
import didIWin from './services/didIWin';
import { createGameBoard, getRequiredTermsLength } from './services/gameMaker';
import gameService from './services/gameService';

const router = express.Router();

router.post('/createGame', async function (req, res) {
  const { gameName, userId, gameId } = req.query as {
    gameName?: string;
    userId?: string;
    gameId?: string;
  };

  if (!gameName || !userId) {
    res.status(400).send('Bad Request');
  }

  let game = await gameService.createGame(gameName, userId);

  if (gameId) {
    const fromGame = await gameService.getGame(gameId);
    if (fromGame) {
      fromGame.terms.forEach(async (term) => {
        await gameService.insertTerm(game.id, term.text);
      });
      game = await gameService.getGame(game.id);
    }
  }

  res.json(game);
});

router.post('/startGame', async function (req, res) {
  let { gameId, variant } = req.query as {
    gameId?: string;
    variant?: BoardVariant;
  };

  if (!gameId || !Object.values(BoardVariant).includes(variant)) {
    res.status(400).send('Bad Request');
  } else {
    const game = await gameService.getBoardMakingData(gameId);

    if (
      !game ||
      game.status !== GameStatus.Unstarted ||
      game.terms.length < getRequiredTermsLength(variant)
    ) {
      res.status(400).send('Bad Request');
    }

    await gameService.setGameStatus(gameId, GameStatus.Building);

    for (const gamePlayer of game.game_players) {
      const board = createGameBoard(
        game.terms.map((t) => t.id),
        variant
      );
      await gameService.updateGamePlayerBoard(
        gameId,
        gamePlayer.player.id,
        board
      );
    }

    await gameService.setGameVariant(gameId, variant);
    await gameService.setGameStatus(gameId, GameStatus.Started);

    res.status(204).send();
  }
});

router.post('/markTerm', async function (req, res) {
  let { termId, userId } = req.query as {
    termId?: string;
    userId?: string;
  };

  const game = await gameService.markTerm(termId, userId);

  if (!game) {
    res.status(400).send('Bad Request');
  } else {
    const winningTerms = game.terms.reduce((acc, cur) => {
      if (cur.marked_by) {
        acc[cur.id] = true;
      }
      return acc;
    }, {} as { [id: string]: boolean });

    let weHaveAWinner = false;

    game.game_players.forEach(async (gp) => {
      const won = didIWin(gp.board, winningTerms);
      if (won) {
        weHaveAWinner = true;
        await gameService.markAsWinner(gp.player_id);
      }
    });

    if (weHaveAWinner) {
      await gameService.setGameStatus(game.id, GameStatus.Finished);
    }

    res.status(204).send();
  }
});

router.get('/', (req, res) => {
  res.status(204).send();
});

export default router;
