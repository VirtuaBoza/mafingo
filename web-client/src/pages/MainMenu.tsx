import { css } from '@emotion/react';
import React from 'react';
import { Button, Logo } from '../components';
import { useTheme } from '../hooks';

const MainMenu: React.FC = () => {
  const { spacing } = useTheme();
  return (
    <div
      css={css`
        height: 100vh;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        /* align-items: center; */
        /* justify-content: center; */
        padding: ${spacing.small};
      `}
    >
      <div
        css={css`
          flex: 1;
          min-height: 0;
        `}
      >
        <Logo />
      </div>
      <div
        css={css`
          display: grid;
          row-gap: 1rem;
          justify-items: center;
        `}
      >
        <Button onPress={() => {}} label="Start a New Game" />
        <Button onPress={() => {}} label="Join a Game" />
        <Button onPress={() => {}} label="My Games" />
      </div>
    </div>
  );
};

export default MainMenu;
