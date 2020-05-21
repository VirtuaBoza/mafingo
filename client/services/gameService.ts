import { Observable } from 'apollo-link';
import gql from 'graphql-tag';
import { BoardVariant, Game, GameStatus as Status, Term } from 'mafingo-core';
import client from '../apolloClient';
import getEnvVars from '../environment';
import httpClient from '../utils/httpClient';

const GAME = `
{
  id
  name
  status
  variant
  terms(order_by: {created_at: asc}) {
    id
    text
    updated_at
    marked_by
  }
  game_players(order_by: {created_at: asc}) {
    player {
      id
      username
    }
    ready
    board
    winner
  }
  game_master_id
}
`;

function createGame(name: string, userId: string): Promise<Game> {
  return client
    .mutate({
      variables: { userId, name },
      mutation: gql`
        mutation AddGame($userId: uuid!, $name: String!) {
          insert_games(
            objects: {
              game_master_id: $userId
              name: $name
              game_players: { data: { player_id: $userId, ready: true } }
            }
          ) {
            returning ${GAME}
          }
        }
  `,
    })
    .then((res) => {
      if (res.errors) throw res.errors;
      return res.data.insert_games.returning[0];
    });
}

function getGame(id: string): Promise<Game> {
  return client
    .query({
      fetchPolicy: 'no-cache',
      variables: { id },
      query: gql`
          query GetGame($id: String!) {
            games_by_pk(id: $id) ${GAME}
          }
        `,
    })
    .then((res) => {
      if (res.errors) throw res.errors;
      return res.data.games_by_pk;
    });
}

function subscribeToGame(id: string): Observable<Game> {
  return client
    .subscribe({
      variables: { id },
      query: gql`
          query GetGame($id: String!) {
            games_by_pk(id: $id) ${GAME}
          }
        `,
    })
    .map((res) => {
      if (res.errors) throw res.errors;
      return res.data.games_by_pk as Game;
    });
}

function upsertTerm(gameId: string, term: Term): Promise<boolean> {
  return client
    .mutate({
      variables: { id: term.id, text: term.text, gameId },
      mutation: gql`
        mutation UpsertTerm($id: uuid!, $text: String!, $gameId: String!) {
          insert_terms(
            objects: { game_id: $gameId, id: $id, text: $text }
            on_conflict: {
              constraint: terms_pkey
              update_columns: text
              where: { game_id: { _eq: $gameId }, id: { _eq: $id } }
            }
          ) {
            affected_rows
          }
        }
      `,
    })
    .then((res) => {
      if (res.errors) throw res.errors;
      return Boolean(res.data.insert_terms.affected_rows);
    });
}

function deleteTerm(gameId: string, id: string): Promise<boolean> {
  return client
    .mutate({
      variables: { id, gameId },
      mutation: gql`
        mutation DeleteTerm($id: uuid!, $gameId: String!) {
          delete_terms(where: { game_id: { _eq: $gameId }, id: { _eq: $id } }) {
            affected_rows
          }
        }
      `,
    })
    .then((res) => {
      if (res.errors) throw res.errors;
      return Boolean(res.data.delete_terms.affected_rows);
    });
}

async function upsertGamePlayer(
  gameId: string,
  userId: string,
  ready: boolean = false
): Promise<Game | undefined> {
  const status: Status | null | undefined = (await getGame(gameId))?.status;
  if (status === Status.Unstarted) {
    return client
      .mutate({
        variables: { gameId, userId, ready },
        mutation: gql`
            mutation UpsertGamePlayer($gameId: String!, $userId: uuid!, $ready: Boolean!) {
              insert_game_players(
                objects: { game_id: $gameId, player_id: $userId, ready: $ready },
                on_conflict: {constraint: game_players_pkey, update_columns: ready}
              ) {
                affected_rows
                returning {
                  game ${GAME}
                }
              }
            }
          `,
      })
      .then((res) => {
        if (res.errors) throw res.errors;
        return res.data.insert_game_players.returning[0]?.game;
      });
  } else {
    return new Promise<Game>((res) => res());
  }
}

function getMyGames(userId: string): Promise<Game[]> {
  return client
    .query({
      fetchPolicy: 'no-cache',
      variables: { userId },
      query: gql`
        query GetMyGames($userId: uuid!) {
          players_by_pk(id: $userId) {
            game_players {
              game ${GAME}
            }
          }
        }
      `,
    })
    .then((res) => {
      if (res.errors) throw res.errors;
      return res.data.players_by_pk.game_players.map((n: any) => n.game);
    });
}

function startGame(gameId: string, variant: BoardVariant): Promise<any> {
  return httpClient.post(
    `http://${
      getEnvVars()?.domain
    }/api/startGame?gameId=${gameId}&variant=${variant}`
  );
}

function getBoardSize(variant: BoardVariant): [number, boolean] {
  switch (variant) {
    case BoardVariant.Lesser:
      return [3, true];
    case BoardVariant.Andean:
      return [3, false];
    case BoardVariant.Chilean:
      return [4, false];
    case BoardVariant.Caribbean:
      return [5, true];
    case BoardVariant.Greater:
    default:
      return [5, false];
  }
}

function markTerm(termId: string, userId: string): Promise<any> {
  return httpClient.post(
    `http://${
      getEnvVars()?.domain
    }/api/markTerm?termId=${termId}&userId=${userId}`
  );
}

export default {
  createGame,
  getGame,
  subscribeToGame,
  upsertTerm,
  deleteTerm,
  upsertGamePlayer,
  getMyGames,
  getBoardSize,
  startGame,
  markTerm,
};
