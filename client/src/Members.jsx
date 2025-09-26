import React from 'react';
import { useRouter } from './context/RouterContext';

const Members = () => {
  const { navigate } = useRouter();

  return (
    <div>
      <h2>Members View</h2>
      <p>This is the members page.</p>
      <button onClick={() => navigate('/')}>Go to Shopping List</button>
    </div>
  );
};

export default Members;