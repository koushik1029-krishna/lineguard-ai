export const LINES = [
  {
    name: 'Cut & Form',
    equipment: ['Press brake PB-2', 'Laser cutter LC-1'],
  },
  {
    name: 'Weld Cell',
    equipment: ['Weld robot WR-3', 'Weld positioner WP-1'],
  },
  {
    name: 'Machine Shop',
    equipment: ['Haas VF-4 mill', 'Mazak lathe QT-250'],
  },
  {
    name: 'Assembly & Test',
    equipment: ['Hydrostatic test bay HT-2', 'Torque station TS-6'],
  },
  {
    name: 'Finish & Pack',
    equipment: ['Powder coat booth PC-1', 'Pack-out scale SC-4'],
  },
];

export const EQUIPMENT = LINES.flatMap((line) =>
  line.equipment.map((name) => ({ name, line: line.name })),
);

export const CATEGORIES = ['Mechanical', 'Electrical', 'Quality', 'Process', 'Safety'];

export const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

export const STATUSES = ['Open', 'In Progress', 'Resolved'];

export function equipmentForLine(lineName) {
  return EQUIPMENT.filter((item) => item.line === lineName).map((item) => item.name);
}
