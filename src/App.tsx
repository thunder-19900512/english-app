import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './components/home/Home';
import { Stage } from './components/stage/Stage';
import { Certificate } from './components/certificate/Certificate';
import { Login } from './components/auth/Login';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { DictionaryHome } from './components/dictionary/DictionaryHome';
import { CategoryDashboard } from './components/dictionary/CategoryDashboard';
import { LearnMode } from './components/dictionary/LearnMode';
import { PracticeMode } from './components/dictionary/PracticeMode';
import { SpellingGame } from './components/dictionary/games/SpellingGame';
import { VoiceBattle } from './components/dictionary/games/VoiceBattle';
import { WordSearch } from './components/dictionary/games/WordSearch';
import { QAMode } from './components/dictionary/games/QAMode';
import { ReflectionForm } from './components/reflection/ReflectionForm';
import { ReflectionHistory } from './components/reflection/ReflectionHistory';


const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/stage/:id" element={<Stage />} />
          <Route path="/certificate" element={<Certificate />} />
          <Route path="/dictionary" element={<DictionaryHome />} />
          <Route path="/dictionary/:category" element={<CategoryDashboard />} />
          <Route path="/dictionary/:category/learn" element={<LearnMode />} />
          <Route path="/dictionary/:category/practice" element={<PracticeMode />} />
          <Route path="/dictionary/:category/game/spelling" element={<SpellingGame />} />
          <Route path="/dictionary/:category/game/voice" element={<VoiceBattle />} />
          <Route path="/dictionary/:category/game/wordsearch" element={<WordSearch />} />
          <Route path="/dictionary/:category/game/qa" element={<QAMode />} />
          
          <Route path="/reflection" element={<ReflectionForm />} />
          <Route path="/reflection/history" element={<ReflectionHistory />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
