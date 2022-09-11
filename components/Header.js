import styles from '../styles/Home.module.css';
import { useEffect } from 'react';
import { useMoralis } from 'react-moralis';
import { BiSearchAlt } from 'react-icons/bi';

export default function Header() {
  const dummy = 'jasldkjalsdjaklsjdlkasjdlkajsdlkajsd';

  return (
    <nav className={styles.navbar}>
      <span>PsychoArt</span>
      <div className={styles.navbarInputContainer}>
        <BiSearchAlt />
        <input type="text" placeholder="Search items and collections"></input>
      </div>
      <a href="#">Collections</a>
      <a href="#">Feature</a>
      <a href="#">FAQ</a>
      {false ? (
        <div className="ml-auto py-2 px-4">
          Connected to {dummy.slice(0, 6)}...
          {dummy.slice(dummy.length - 4)}
        </div>
      ) : (
        <button className={styles.navbarBtn}>Select Wallet</button>
      )}
    </nav>
  );
}
