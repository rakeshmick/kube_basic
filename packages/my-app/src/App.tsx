import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";

interface User {
  address: string;
  name: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("http://localhost:30001/user")
      .then((response) => response.json())
      .then((data) => setUser(data))
      .catch((error) => console.error("Error fetching user data:", error));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>User Information</h1>
        {user ? (
          <div>
            <p>Address: {user.address}</p>
            <p>Name: {user.name}</p>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </header>
    </div>
  );
}

export default App;
