import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button';

export const WordSearch: React.FC = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();

  return (
    <div className="flex-col flex-center gap-lg">
      <h1>言葉さがしパズル (Comming soon)</h1>
      <Button onClick={() => navigate(`/dictionary/${category}`)}>もどる</Button>
    </div>
  );
};
