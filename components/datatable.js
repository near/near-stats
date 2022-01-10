import React, { useState } from 'react';
import * as d3 from "d3";
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TableSortLabel from '@mui/material/TableSortLabel';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import TablePagination from '@mui/material/TablePagination'
import { visuallyHidden } from '@mui/utils';
import Image from 'next/image'
import styles from '../styles/datatable.module.scss'


// sort functions
function descendingComparator(a, b, orderBy) {
  if (orderBy === 'entity_id'){
    var elementA = a[orderBy].toLowerCase()
    var elementB = b[orderBy].toLowerCase()
  } else {
    var elementA = a[orderBy]
    var elementB = b[orderBy]
  }

  if (elementB < elementA) {
    return -1;
  }
  if (elementB > elementA) {
    return 1;
  }
  return 0;
}

//number formatting function
function formatNumber(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

// Set Header
const headCells = [
  {
    id: 'entity_id',
    numeric: false,
    disableSort: false,
    label: 'App',
  },
  {
    id: 'total_accounts',
    numeric: true,
    disableSort: false,
    label: 'Total Accounts',
  },
  {
    id: 'bar',
    numeric: true,
    disableSort: true,
    label: '',
  },
  {
    id: 'thirty_d',
    numeric: true,
    disableSort: false,
    label: '30d Δ',
  },
  {
    id: 'arrow30',
    numeric: true,
    disableSort: true,
    label: '',
  },
  {
    id: 'ninety_d',
    numeric: true,
    disableSort: false,
    label: '90d Δ',
  },
  {
    id: 'arrow90',
    numeric: true,
    disableSort: true,
    label: '',
  }
];

// Table Header
function EnhancedTableHead(props) {
  const { order, orderBy, onRequestSort } =
    props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow className={styles.table_row}>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align='left'
            className={styles.table_cell_header}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            {headCell.disableSort === false ? (<TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
              className={styles.table_sort_label}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden} >
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>) : headCell.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired
};

function Datatable({ data = [], app_data = [], name = '_name', accounts = '_accounts', thirty = '_thirty', ninety = '_ninety' }) {

  //declare states for pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setrowsPerPage] = useState(10)

  //declare pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setrowsPerPage(+event.target.value)
    setPage(0)
  }

  const svgRef = React.useRef();

  let app_lookup = {}
  app_data.forEach(d => app_lookup[d.slug] = d)

  // format 30d and 90d columns
  function growth(total, added) {
    if (added) {
      return Math.floor((total - added) / added * 100)
    } else { return ' - ' }
  }

  data.forEach(function (d) {
    d["thirty_d"] = growth(d[accounts], d[thirty])
    d["ninety_d"] = growth(d[accounts], d[ninety])
  });

  function growthArrow(value) {
    if (value > 0) {
      return <ArrowUpwardIcon sx={{ paddingTop: `5px` }} />
    } else if (value < 0) {
      return <ArrowDownwardIcon sx={{ paddingTop: `5px` }} />
    } else { return '' }
  }

  // responsive width & height
  const svgWidth = 100
  const svgHeight = 5

  // scale bars
  const xScale = d3.scaleLinear()
    .range([0, svgWidth])
    .domain([0, d3.max(data, d => d[accounts])])

  // enable sort
  const [order, setOrder] = React.useState('desc');
  const [orderBy, setOrderBy] = React.useState('total_accounts');

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  return (

    <React.Fragment>
      <TableContainer component={Paper} className={styles.table_container}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <EnhancedTableHead
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
          />
          <TableBody className="table_body">
            {stableSort(data, getComparator(order, orderBy)).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
              <TableRow
                tabIndex={-1}
                key={row[name]}
              >

                <TableCell className={styles.table_cell_app} >
                  <a href={app_lookup[row[name]].website} target='_blank' rel="noreferrer"><Image src={app_lookup[row[name]].logo} alt={app_lookup[row[name]].title + ' logo'} width={25} height={25} className="round-image"></Image></a><span style={{marginLeft:'10%'}}>{app_lookup[row[name]].title}</span>
                </TableCell>
                <TableCell align="left" className={styles.table_cell_total_accounts}>
                  {formatNumber(row[accounts])}
                </TableCell>
                <TableCell align="left" className={styles.table_cell_total_accounts_bar} >
                  <svg ref={svgRef} width="60%" viewBox={'0 0 ' + svgWidth + ' ' + svgHeight} style={{ marginRight: `20%` }}>
                    <linearGradient id="datatable-gradient" x1="0" y1="100%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#78ced8" stopOpacity=".17" />
                      <stop offset="100%" stopColor="#75B8BF" stopOpacity="1" />
                    </linearGradient>
                    <rect height={svgHeight} width={xScale(row[accounts])} fill="url(#datatable-gradient)"></rect>
                  </svg>
                </TableCell>
                <TableCell align="left" className={styles.table_cell_change}>
                  {row["thirty_d"] + '%'}
                </TableCell>
                <TableCell align="left" className={styles.table_cell_change_arrow}>
                  {growthArrow(row["thirty_d"])}
                </TableCell>
                <TableCell align="left" className={styles.table_cell_change}>
                  {row["ninety_d"] + '%'}
                </TableCell>
                <TableCell align="left" className={styles.table_cell_change_arrow}>
                  {growthArrow(row["ninety_d"])}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10]}
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        className={styles.table_cell_change}
      />
    </React.Fragment>
  )
}

export default Datatable;
