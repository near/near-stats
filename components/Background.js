import React from 'react'
import styles from '../styles/Background.module.scss'

export default function Background() {
  return (
    <>
      <div 
        className={styles.ovalContainer}>
        <div style={{width:'25%'}}>
          <div className={styles.ovalLeft}></div>
        </div>
        <div style={{width:'25%'}}>
          <div className={styles.ovalRight}></div>
        </div>
      </div>
    </>
  )
}
