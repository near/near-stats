import React from 'react'
import styles from '../styles/Graphcard.module.scss'
import Select from 'react-select'
import CreatableSelect from 'react-select/creatable';
import Switch from "react-switch"
import canvasCapture from '../helpers/2dCanvasCapture'


export default function GraphCard({ icon, title, children, size = "full", setSelect, label_type, setLabel, dateCompare, placeholder }) {

  const elementRef = React.useRef();

  //declare handlers
  //save screenshot
  const handleCaptureClick = () => {
    canvasCapture(title, elementRef.current)
  }
  
  // set list for goals and milestones
  const handleGoals = (event) => {
    let goal_list = []
    event.forEach(d => goal_list.push(d.value))
    setSelect(goal_list)
    
  };
  
  // percentage switch for barChart
  const [checked, setChecked] = React.useState(false);
  const handleLabel = () => {
    setChecked(!checked)
    if (label_type === 'Number') {
      setLabel('Percent')
    } else {
      setLabel('Number')
    }
  };
  
  // set view for areaChart
  const handleDetail = (event) => {
    setSelect(event.value)
  }

  let dropdown, dynamic_title
  //set the dropdown menu and title based on the card title
  if (title === 'Total NEAR Accounts' || title === 'Top NEAR Apps') {
    dropdown =
      <CreatableSelect
        isMulti
        className={styles.react_select_container}
        classNamePrefix={"react_select"}
        isClearable={false}
        components={{
          IndicatorSeparator: () => null
        }}
        noOptionsMessage={() =>"Type to add"}
        placeholder={placeholder}
        onChange={handleGoals}
        options={[]}
        instanceId={title}
      />

    dynamic_title = title + ' (' + dateCompare + ' Day Growth)'
  } else if (title === 'Total NEAR Accounts by App' || title === 'NEAR Account Growth By App') {
    dropdown =
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
        instanceId={title}
      />
    dynamic_title = title + ' (Last ' + dateCompare + ' Days)'
  } else {
    // no dropdown or compare period for table
    dropdown = ''
    dynamic_title = title
  }

  let label_switch
  // define switch for barChart
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
  } else {
    // no switch for other graphs
    label_switch = ''
  }



  return (
    <>
    <div ref={elementRef} className={`${styles.cardContainer} ${size}`}>
      <div className={styles.cardInner}>
        <div className="global-flex-container">
          <div className="global-flex-inner global-flex-inner-left">
            <img src={icon} className={styles.cardlogo} />
            <h3>
              {dynamic_title}
            </h3>
          </div>
          <div className="global-flex-inner global-flex-inner-right" data-html2canvas-ignore="">
            {dropdown}
            <div className="global-spacer"></div>
            <button className={styles.iconButton} onClick={handleCaptureClick}>
              <img src='/images/share-2share.png' className={styles.share} />
            </button>
          </div>
        </div>
        <div className={`${styles.switchContainer}`} data-html2canvas-ignore="">
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
