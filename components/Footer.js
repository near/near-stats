import styles from '../styles/Footer.module.scss'
import React from 'react'

// sticky footer for report a bug button
export default function Footer({ }) {

  return (
    <div className={styles.footerContainer} >
        <div className={styles.bugButton} ><a href="https://github.com/datacult/near-stats/issues" target='_blank' rel="noreferrer">Report a bug</a></div>
    </div>
  )
}
