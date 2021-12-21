import React from 'react'
import styles from '../styles/Graphcard.module.scss'
import Select from 'react-select'
import Switch from "react-switch"
import canvasCapture from '../helpers/2dCanvasCapture'


export default function GraphCard({ icon, title, children, size = "full", setGoals, setMilestones, setDetail, setDetail1, label_type, setLabel, dateCompare }) {

  const elementRef = React.useRef();

  //declare handlers
  //save screenshot
  const handleCaptureClick = () => {
    canvasCapture(title, elementRef.current)
  }
  
  //goals
  const handleGoals = (event) => {
    let goal_list = []
    event.forEach(d => goal_list.push(d.value))
    setGoals(goal_list)
    
  };
  
  //milestones
  const handleMilestones = (event) => {
    let goal_list = []
    event.forEach(d => goal_list.push(d.value))
    setMilestones(goal_list)
    
  };
  
  //percentage switch
  const [checked, setChecked] = React.useState(false);
  const handleLabel = () => {
    setChecked(!checked)
    if (label_type === 'Number') {
      setLabel('Percent')
    } else {
      setLabel('Number')
    }
  };
  
  //NEAR accounts by app detail
  const handleDetail = (event) => {
    setDetail(event.value)
  }
  
  //NEAR account growth by app detail
  const handleDetail1 = (event) => {
    setDetail1(event.value)
  }

  let sel, comp
  //set the dropdown menu based on the card title
  if (title === 'Total NEAR Accounts') {
    sel =
      <Select
        isMulti
        className={styles.react_select_container}
        classNamePrefix={"react_select"}
        isSearchable={false}
        isClearable={false}
        components={{
          IndicatorSeparator: () => null
        }}
        placeholder="Goals"
        onChange={handleGoals}
        options={[{ value: 2000000, label: '2.0M' }, { value: 2500000, label: '2.5M' }, { value: 3000000, label: '3.0M' }]}
      />

    comp = title + ' (' + dateCompare + ' Day Growth)'
  } else if (title === 'Top NEAR Apps') {

    sel = <>
      <Select
        isMulti
        className={styles.react_select_container}
        classNamePrefix={"react_select"}
        isSearchable={false}
        isClearable={false}
        components={{
          IndicatorSeparator: () => null
        }}
        placeholder="Milestones"
        onChange={handleMilestones}
        options={[{ value: 10000, label: '10k' }, { value: 20000, label: '20k' }, { value: 30000, label: '30k' }, { value: 40000, label: '40k' }, { value: 50000, label: '50k' }, { value: 60000, label: '60k' }, { value: 70000, label: '70k' }]}
      />
    </>

    comp = title + ' (' + dateCompare + ' Day Growth)'
  } else if (title === 'Total NEAR Accounts by App') {
    sel =
      <Select
        className={styles.react_select_container}
        classNamePrefix={"react_select"}
        isSearchable={false}
        isClearable={false}
        components={{
          IndicatorSeparator: () => null
        }}
        defaultValue={{ value: false, label: 'Overview' }}
        onChange={handleDetail}
        options={[{ value: false, label: 'Overview' }, { value: true, label: 'Top 10' }]}
      />
    comp = title + ' (Last ' + dateCompare + ' Days)'
  } else if (title === 'NEAR Account Growth By App') {
    sel =
      <Select
        className={styles.react_select_container}
        classNamePrefix={"react_select"}
        isSearchable={false}
        isClearable={false}
        components={{
          IndicatorSeparator: () => null
        }}
        defaultValue={{ value: false, label: 'Overview' }}
        onChange={handleDetail1}
        options={[{ value: false, label: 'Overview' }, { value: true, label: 'Top 10' }]}
      />

    comp = title + ' (Last ' + dateCompare + ' Days)'
  } else {
    sel = ''
    comp = title
  }

  let label_switch
  let header_padding
  if (title === 'Top NEAR Apps') {
    label_switch = <Switch
      checked={checked}
      onChange={handleLabel}
      onHandleColor="#5F8AFA"
      offHandleColor="#A463B0"
      onColor="#E5E5E5"
      offColor="#E5E5E5"
      uncheckedIcon={false}
      checkedIcon={false}
      uncheckedHandleIcon={<div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: 'white',
          fontSize: '.9em'
        }}>
        %
      </div>}
      checkedHandleIcon={<div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: 'white',
          fontSize: '.9em'
        }}>
        #
      </div>}
      height={20}
      handleDiameter={20}
      width={35}
    />

    header_padding = '0'
  } else { label_switch = ''; header_padding = '16px' }



  return (
    <>
    <div ref={elementRef} className={`${styles.cardContainer} ${size}`}>
      <div className={styles.cardInner}>
        <div className="global-flex-container">
          <div className="global-flex-inner global-flex-inner-left">
            <img src={icon} className={styles.cardlogo} />
            <h3>
              {comp}
            </h3>
          </div>
          <div className="global-flex-inner global-flex-inner-right hide-on-capture">
            {sel}
            <div className="global-spacer"></div>
            <button className={styles.iconButton} onClick={handleCaptureClick}>
              <img src='/images/share-2share.png' className={styles.share} />
            </button>
          </div>
        </div>
        <div className={`${styles.switchContainer} hide-on-capture`}>
          {label_switch}
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
    </>
  )
}
