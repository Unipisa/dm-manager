export default function Home({ api }) {
    return (<>
      <p>user: {`${JSON.stringify(api.user())}`}</p>
      </>
    );
  }
  
  