import React from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { displayValue } from '../util/individualValidation';

const useStyles = makeStyles({
  container: {
    overflowX: 'auto',
    maxHeight: '50vh',
  },
});

export default function ValidationDataTable({ columns, rows = [] }) {
  const classes = useStyles();
  return (
    <div className={classes.container}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.key}>{column.label}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
          // Redacted attempt rows may have no individual identity.
          // eslint-disable-next-line react/no-array-index-key
            <TableRow key={row.id ?? row.individual_uuid ?? index}>
              {columns.map((column) => (
                <TableCell key={column.key}>{displayValue(row[column.key])}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
