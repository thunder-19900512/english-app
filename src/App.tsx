import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './components/home/Home';
import { Stage } from './components/stage/Stage';
import { Certificate } from './components/certificate/Certificate';
import { Login } from './components/auth/Login';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { DictionaryHome } from './components/dictionary/DictionaryHome';
import { CategoryDashboard } from './components/dictionary/CategoryDashboard';
import { LearnMode } from './components/dictionary/LearnMode';
import { PracticeMode } from './components/dictionary/PracticeMode';
import { SpellingGame } from './components/dictionary/games/SpellingGame';
import { TypingPractice } from './components/dictionary/games/TypingPractice';
import { VoiceBattle } from './components/dictionary/games/VoiceBattle';
import { WordSearch } from './components/dictionary/games/WordSearch';
import { QAMode } from './components/dictionary/games/QAMode';
import { AIAssistant } from './components/dictionary/games/AIAssistant';
import { StoryMode } from './components/dictionary/games/StoryMode';
import { ReflectionForm } from './components/reflection/ReflectionForm';
import { ReflectionHistory } from './components/reflection/ReflectionHistory';
import { TextbookMode } from './components/textbook/TextbookMode';
import { MyProgress } from './components/progress/MyProgress';
import { DialogueTrainer } from './components/dialogue/DialogueTrainer';
import { MicTest } from './components/mic/MicTest';
import { Shop } from './components/shop/Shop';
import { ClassTree } from './components/tree/ClassTree';
import { SkillTest } from './components/dictionary/SkillTest';
import { ToastHost } from './components/ui/Toast';


const App: React.FC = () => {
  return (
    <Router>
      {/* 画面固定の通知（ポイント獲得・クリア・もう一回）。スクロール位置に関係なく見える */}
      <ToastHost />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/stage/:id" element={<Stage />} />
            <Route path="/certificate" element={<Certificate />} />
            <Route path="/dictionary" element={<DictionaryHome />} />
            <Route path="/dictionary/:category" element={<CategoryDashboard />} />
            <Route path="/dictionary/:category/learn" element={<LearnMode />} />
            <Route path="/dictionary/:category/practice" element={<PracticeMode />} />
            <Route path="/dictionary/:category/game/spelling" element={<SpellingGame />} />
            <Route path="/dictionary/:category/game/typing" element={<TypingPractice />} />
            <Route path="/dictionary/:category/game/voice" element={<VoiceBattle />} />
            <Route path="/dictionary/:category/game/wordsearch" element={<WordSearch />} />
            <Route path="/dictionary/:category/game/qa" element={<QAMode />} />
            <Route path="/ai" element={<AIAssistant />} />
            <Route path="/story" element={<StoryMode />} />
            <Route path="/textbook" element={<TextbookMode />} />
            <Route path="/progress" element={<MyProgress />} />
            <Route path="/mictest" element={<MicTest />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/tree" element={<ClassTree />} />
            <Route path="/skilltest" element={<SkillTest />} />
            <Route path="/dialogue" element={<DialogueTrainer />} />

            <Route path="/reflection" element={<ReflectionForm />} />
            <Route path="/reflection/history" element={<ReflectionHistory />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
