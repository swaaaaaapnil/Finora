import React from 'react';
import { checkUser } from '@/lib/checkuser';
import Nav from './Nav';

const Head = async () => {
  await checkUser();
  return <Nav />;
};

export default Head;
