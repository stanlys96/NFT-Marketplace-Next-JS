import styles from '../styles/Home.module.css';
import NFTCard from './NFTCard';

export default function Collection() {
  return (
    <div className={styles.collection}>
      <p>Collection</p>
      <p>Lorem ipsum dolor sit amet, consectetur</p>
      <div className={styles.nftContainer}>
        <NFTCard />
      </div>
    </div>
  );
}
