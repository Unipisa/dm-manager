export default function Home({ engine }) {
    return (<>
      <p>user: {`${JSON.stringify(engine.user())}`}</p>
      </>
    );
  }
  
  