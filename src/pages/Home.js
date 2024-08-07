import { useEngine } from '../Engine'
import Processes from '../processes/Home'

export default function Home() {
  const user = useEngine().user

  // console.log('Home user', user)

  return <>
    <Processes />
    <p>
        Puoi accedere al <a href="/profile">tuo profilo</a>.
        Per problemi o informazioni scrivi a <a href="mailto:help@dm.unipi.it">help@dm.unipi.it</a>.
        {} {user?.roles?.length>0 && `I tuoi permessi: ${user.roles.join(', ')}. `}
        {} {user?.roles?.length===0 && `Non risultano permessi assegnati al tuo utente.`}
        {} {user?.staffs?.length>0 && `Le tue qualifiche: ${user.staffs.map(staff => staff.qualification).join(', ')}. `}
        {} {user?.staffs?.length===0 && `Non risultano qualifiche assegnate al tuo utente.`}
    </p>
  </>
  }

  
  
