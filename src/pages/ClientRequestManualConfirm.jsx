import { useLocation, useNavigate } from 'react-router-dom'
import OrderConfirm from './OrderConfirm'

const ClientRequestManualConfirm = ({ user }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { requestType, userData } = location.state || {}

  // Prepare state for OrderConfirm with manual flow context
  const orderConfirmState = {
    userData: userData || user,
    requestType,
    isManualEntry: true,
    isLoggedInFlow: true,
    returnTo: '/client/requests-intro'
  }

  // Inject the state into the component
  return <OrderConfirm user={user} injectedState={orderConfirmState} />
}

export default ClientRequestManualConfirm
