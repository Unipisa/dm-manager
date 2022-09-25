export default function Home({ user }) {
    return (<>
      <p>Ciao {`${JSON.stringify(user.firstName)}`}</p>
      </>
    );
  }
  
  