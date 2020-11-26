import Form from '../screens/MainScreen/FormScreen'
import FormDetail from '../screens/MainScreen/FormDetailScreen'
import Quiz from '../screens/MainScreen/QuizScreen'
import QuizDetail from '../screens/MainScreen/QuizDetailScreen'
import QuizSolution from '../screens/MainScreen/QuizSolutionScreen'
import Exam from '../screens/MainScreen/ExamScreen'
import Profile from '../screens/MainScreen/ProfileScreen'

const ROOT_PATH = '/'

const HOME_ROUTE = [
  {
    name: 'Form',
    path: ROOT_PATH + 'form',
    component: Form
  },
  {
    name: 'Form Detail',
    path: ROOT_PATH + 'form/:id',
    component: FormDetail
  },
  {
    name: 'Exam',
    path: ROOT_PATH + 'quiz/exam/:examid',
    component: Exam
  },
  {
    name: 'Quiz Solution',
    path: ROOT_PATH + 'quiz/:quizid/solution',
    component: QuizSolution
  },
  {
    name: 'Quiz Detail',
    path: ROOT_PATH + 'quiz/:quizid',
    component: QuizDetail
  },
  {
    name: 'Quiz',
    path: ROOT_PATH + 'quiz',
    component: Quiz
  },
  {
    name: 'Profile',
    path: ROOT_PATH + 'profile',
    component: Profile
  }
]

export { HOME_ROUTE }
