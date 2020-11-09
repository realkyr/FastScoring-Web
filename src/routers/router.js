import Form from '../screens/MainScreen/FormScreen'
import Quiz from '../screens/MainScreen/QuizScreen'
import Profile from '../screens/MainScreen/ProfileScreen'

const ROOT_PATH = '/'

const HOME_ROUTE = [
  {
    name: 'Form',
    path: ROOT_PATH + 'form',
    component: Form
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
