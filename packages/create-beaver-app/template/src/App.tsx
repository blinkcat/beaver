import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import styles from './App.module.css';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Hello />}>
        <Route path=":name" element={<Hello />} />
      </Route>
    </Routes>
  );
};

export default App;

const Hello: React.FC = () => {
  const { name = 'beaver' } = useParams();
  return <p className={styles.fs16}>hello {name}!</p>;
};
