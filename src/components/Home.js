export default function Home({ api }) {
    return (<>
      <p>Ciao {`${JSON.stringify(api.user().firstName)}`}</p>
      </>
    );
  }
  
  