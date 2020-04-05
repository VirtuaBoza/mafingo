import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Label, PageContainer, Title } from '../components';
import gameService from '../services/gameService';
import { connect, selectGameById } from '../store';
import {
  createGameCreatedAction,
  createSetGameTermsAction,
} from '../store/reducers/gamesReducer';

export default connect(
  ({ route }) => {
    const { gameId } = route.params;
    const gameSelector = selectGameById(gameId);
    return { game: gameSelector };
  },
  {
    setGameTerms: createSetGameTermsAction,
    updateGame: createGameCreatedAction,
  }
)(GameLobbyScreen);

export function GameLobbyScreen({ game, setGameTerms, updateGame }) {
  const [newTerm, setNewTerm] = useState('');
  const [localTerms, setLocalTerms] = useState(game.terms);
  const ref = useRef();

  useEffect(() => {
    gameService.getGame(game._id).then((game) => {
      updateGame(game);
      setLocalTerms(game.terms);
    });
  }, []);

  useEffect(() => {
    let timeout;
    timeout = setTimeout(() => {
      if (ref.current) {
        ref.current.focus();
      }
    }, 1);

    function handleKeyboardHide() {
      setLocalTerms(localTerms.filter((t) => t.trim()));
    }
    Keyboard.addListener('keyboardDidHide', handleKeyboardHide);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      Keyboard.removeListener('keyboardDidHide', handleKeyboardHide);
    };
  });

  function handleAddTermClick() {
    setLocalTerms([...localTerms, '']);
  }

  function handleSubmitTerm() {
    gameService.addTermToGame(game._id, newTerm.trim()).then((terms) => {
      setGameTerms(game._id, terms);
      setLocalTerms([...terms, '']);
      setNewTerm('');
    });
  }

  function handlePlayersPress() {
    console.log(game.players);
  }

  return (
    <PageContainer style={styles.container}>
      <Title text={game.name} />
      <Label text={game.players.length ? 'Players' : 'No Players'} />
      <View>
        <TouchableOpacity onPress={handlePlayersPress}>
          <Text>{game.players.length}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={localTerms}
        renderItem={({ item }) => (
          <View>
            {item ? (
              <Text>{item}</Text>
            ) : (
              <TextInput
                value={newTerm}
                onSubmitEditing={handleSubmitTerm}
                onChangeText={setNewTerm}
                ref={ref}
                blurOnSubmit={false}
              />
            )}
          </View>
        )}
        keyExtractor={(item) => item}
      />
      <Button title="Add Term" onPress={handleAddTermClick} />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 18,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: '#ccc',
    padding: 8,
  },
});
