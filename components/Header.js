import React from 'react'
import styles from '../styles/Header.module.scss'
import Switch from "react-switch"
import Select from 'react-select'
import { setTheme } from '../helpers/theme';


export default function Header({ setDateCompare, setNetwork, setChecked, checked }) {

  //declare date compares
  const handleChange = (event) => {
    setDateCompare(event.value)
  }
  
  //declare React Hooks and handlers
  //dark mode
  const handleDarkMode = (event) => {
    setChecked(event);
    event ? setTheme('theme-dark') : setTheme('theme-light');
  };
  
  //network
  const handleNetwork = (event) => {
    setNetwork(event.value)
  }
  
  //declare network connections
  const connections = [
    {
      value: 'mainnet',
      text: 'Mainnet',
      icon: <></>
    }
  ]

  return (
    <div className={styles.headerContainer}>
      <div className={`global-flex-inner ${styles.flexInnerLeft}`}>
        <a href="http://near.org" target="_blank"><img src={"/images/logo_nm.svg"} className={styles.nearlogo} /></a>
        <div className="global-spacer"></div>
        <Select
          className={styles.react_select_container}
          classNamePrefix={"react_select"}
          isSearchable={false}
          isClearable={false}
          components={{
            IndicatorSeparator: () => null
          }}
          defaultValue={connections[0]}
          options={connections}
          onChange={handleNetwork}
          getOptionLabel={e => (
            e.text === 'Mainnet' ?
              <div className={styles.networkItem}>
                <div className={styles.badge}></div><span> </span>{e.text}<span> </span><img src="/images/signal.svg" width={10} height={11.25}></img>
              </div>
              :
              <div className={styles.networkItem}>
                {e.text}
              </div>
          )}
          instanceId={'network'}
        />
      </div>

      <div className="title-container">
        <div className={styles.title} align="center">
          MOMENTUM
        </div>
      </div>

      <div className={`global-flex-inner ${styles.flexInnerRight}`}>
        <Select
          className={styles.react_select_container}
          classNamePrefix={"react_select"}
          isSearchable={false}
          isClearable={false}
          components={{
            IndicatorSeparator: () => null
          }}
          defaultValue={{ value: 30, label: '30 Days' }}
          onChange={handleChange}
          options={[{ value: 30, label: '30 Days' }, { value: 60, label: '60 days' }, { value: 90, label: '90 days' }]}
          instanceId={'range'}
        />
        <div className="global-spacer"></div>
        <div className={styles.switchContainer}>
        <Switch
            checked={checked}
            onChange={handleDarkMode}
            onColor='#8796A5'
            offColor='#aab4be'
            onHandleColor="#003892"
            offHandleColor="#001e3c"
            handleDiameter={32}
            uncheckedHandleIcon={
              <svg xmlns="http://www.w3.org/2000/svg" height="40" width="40" viewBox="-6 -6 40 40">
                <path fill="#ffffff" d="M9.305 1.667V3.75h1.389V1.667h-1.39zm-4.707 1.95l-.982.982L5.09 6.072l.982-.982-1.473-1.473zm10.802 0L13.927 5.09l.982.982 1.473-1.473-.982-.982zM10 5.139a4.872 4.872 0 00-4.862 4.86A4.872 4.872 0 0010 14.862 4.872 4.872 0 0014.86 10 4.872 4.872 0 0010 5.139zm0 1.389A3.462 3.462 0 0113.471 10a3.462 3.462 0 01-3.473 3.472A3.462 3.462 0 016.527 10 3.462 3.462 0 0110 6.528zM1.665 9.305v1.39h2.083v-1.39H1.666zm14.583 0v1.39h2.084v-1.39h-2.084zM5.09 13.928L3.616 15.4l.982.982 1.473-1.473-.982-.982zm9.82 0l-.982.982 1.473 1.473.982-.982-1.473-1.473zM9.305 16.25v2.083h1.389V16.25h-1.39z"/>
              </svg>
            }
            uncheckedIcon={false}
            checkedHandleIcon={
              <svg xmlns="http://www.w3.org/2000/svg" height="40" width="40" viewBox="-6 -6 40 40">
                <path fill="#ffffff" d="M4.2 2.5l-.7 1.8-1.8.7 1.8.7.7 1.8.6-1.8L6.7 5l-1.9-.7-.6-1.8zm15 8.3a6.7 6.7 0 11-6.6-6.6 5.8 5.8 0 006.6 6.6z"/>
              </svg>
            }
            checkedIcon={false}
            boxShadow="0px 1px 1px rgba(0, 0, 0, 0.6)"
            activeBoxShadow="0px 0px 1px 1px rgba(0, 0, 0, 0.2)"
            height={20}
            width={40}
            className="react-switch"
            id="material-switch"
          />
        </div>
      </div>
    </div>
  )
}
