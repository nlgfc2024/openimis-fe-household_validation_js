import React from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow,
} from '@material-ui/core';
import { displayValue } from '../util/individualValidation';

export default function ValidationDataTable({ columns, rows = [] }) {
  return (
    <div style={{ overflowX: 'auto', maxHeight: 400 }}>
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
