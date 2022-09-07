import styles from '../styles/Home.module.css';

export default function Header() {
  return (
    <nav className={styles.navbar}>
      <span>PsychoArt</span>
      <input type="text"></input>
      <a href="#">Collections</a>
      <a href="#">Feature</a>
      <a href="#">FAQ</a>
      <button>Select Wallet</button>
    </nav>
  );
}
