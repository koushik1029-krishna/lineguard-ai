export const documents = [
  {
    document_code: 'TG-MS-008',
    title: 'Haas VF-4 spindle load and coolant',
    equipment: 'Haas VF-4 mill',
    category: 'Mechanical',
    doc_type: 'Troubleshooting guide',
    approved: 1,
    body: `Approved guide for the Haas VF-4 mill in the Machine Shop.

When a spindle load alarm appears during a facing pass, stop the cycle and do not raise the feed override to push through it. Check three items in order.

1. Coolant concentration. Draw a sample and read it with the refractometer. The approved range for this mill is 7 to 9 percent. If the reading is low, restore concentration before cutting again. A sour or oily smell means the tank needs maintenance; do not keep machining.
2. Nozzle aim and chip packing. Clear packed chips from the nozzle and aim the stream at the cutting edge. A stream that misses the tool will show up as chatter and a torn finish.
3. Spindle housing temperature. If the housing is too hot to rest a hand on comfortably, leave the spindle idle and call maintenance. Do not restart the facing pass until maintenance releases the machine.

Record the alarm text, the refractometer reading, and the part number on the incident.`,
  },
  {
    document_code: 'SOP-MS-019',
    title: 'Surface finish on the Mazak QT-250',
    equipment: 'Mazak lathe QT-250',
    category: 'Quality',
    doc_type: 'Standard operating procedure',
    approved: 1,
    body: `Approved procedure for surface finish checks on the Mazak QT-250.

Valve stems that measure above the drawing finish are held at the machine. Do not send them to Assembly & Test.

Check the insert edge under the bench light. A worn or chipped edge is replaced from the labeled insert drawer, then the finish is rechecked on one piece. Check coolant condition next. A sour smell or a refractometer reading outside 7 to 9 percent is corrected before the lot continues. Do not change the posted feed or speed to hide a finish problem. If a new insert and in-range coolant still leave the finish out of tolerance, stop the lot and call the quality engineer.

Write the lot number, insert code, and coolant reading on the incident.`,
  },
  {
    document_code: 'SOP-WC-014',
    title: 'Shielding gas for weld robot WR-3',
    equipment: 'Weld robot WR-3',
    category: 'Quality',
    doc_type: 'Standard operating procedure',
    approved: 1,
    body: `Approved procedure for shielding gas on weld robot WR-3.

Porosity along a fillet, a peppered bead, or a drifting flow reading means the manifold welds stay on the cart. Do not grind porosity out and send the part on.

Check the cylinder pressure gauge first. An empty or nearly empty cylinder is replaced, the line is purged, and flow is verified at 30 to 40 CFH before the robot is restarted. The posted setpoint for manifold fillets is 35 CFH. If the flow meter needle bounces, inspect the fitting at the regulator for a loose connection. Fans aimed at the cell can pull the gas off the weld; point fans away from the fixture.

Quality sections the next three manifolds after a gas change. Record the cylinder change and the measured flow on the incident.`,
  },
  {
    document_code: 'SOP-WC-002',
    title: 'Weld cell light curtain reset',
    equipment: 'Weld robot WR-3',
    category: 'Safety',
    doc_type: 'Standard operating procedure',
    approved: 1,
    body: `Approved safety procedure for the weld cell light curtain on WR-3.

If the indicator stays red after a reset, the cell stays stopped. Do not bypass the curtain, do not tape a sensor, and do not enter the guarded area to jog the robot.

Look along the curtain from outside the cell for a fixture, cable, or cart blocking a beam. Clear any obstruction from outside the guarded space, then press the posted reset. If the indicator stays red, leave the cell down and call maintenance. Record the time, the operator name, and whether anyone crossed the curtain. Nobody is permitted to cross it while the indicator is red.`,
  },
  {
    document_code: 'WI-CF-003',
    title: 'Press brake PB-2 bend angle',
    equipment: 'Press brake PB-2',
    category: 'Process',
    doc_type: 'Work instruction',
    approved: 1,
    body: `Approved work instruction for bend angle on press brake PB-2.

Air-bend angles on 14 gauge 304 are checked on the first piece, after a material change, and after any break longer than 30 minutes. The allowance is plus or minus one degree unless the drawing says otherwise.

If the angle drifts and the program was not edited, measure blank thickness on three pieces from the current skid. A thicker lot needs a program correction by the lead, not a manual overbend by the operator. Confirm the crowning setting still matches the posted sheet for that tool. Hold the skid when two pieces in a row fall outside the allowance.

Record the measured angle, the blank thickness, and the material heat number.`,
  },
  {
    document_code: 'SOP-CF-010',
    title: 'Laser cutter LC-1 nozzle and focus',
    equipment: 'Laser cutter LC-1',
    category: 'Mechanical',
    doc_type: 'Standard operating procedure',
    approved: 1,
    body: `Approved procedure after a tip-touch failure or a head sitting on the sheet at laser cutter LC-1.

Stop the machine with the emergency stop if the head is down on the material. Do not reach into the table while the head can move.

Maintenance replaces a damaged nozzle and checks the tip-touch wire before anyone homes the head. Focus calibration is rerun from the posted screen after the nozzle change. The next nest does not start until a first article is accepted. If the tip-touch fails a second time on the same shift, the laser stays down.

Record the nozzle condition and that focus calibration was completed.`,
  },
  {
    document_code: 'TG-AT-021',
    title: 'Hydrostatic test leak isolation',
    equipment: 'Hydrostatic test bay HT-2',
    category: 'Quality',
    doc_type: 'Troubleshooting guide',
    approved: 1,
    body: `Approved guide for leaks at hydrostatic test bay HT-2.

A weep, drip, or seat leak during the 1.5 times pressure hold quarantines the unit. Do not wipe the joint and pass the test. Do not raise pressure above the posted hold to "see if it seals."

Dry the body so the leak source is visible. A weep at the seat is an assembly issue: replace the seat seal, torque the end cap to the work instruction for that body, and rerun the full hold. The retest must stay dry for 10 minutes. A leak at a fitting thread is a connection issue and is corrected without replacing the seat seal. Units from the same lot stay in the quarantine rack until quality releases them.

Record the lot number, where the weep appeared, and the retest result.`,
  },
  {
    document_code: 'SOP-AT-011',
    title: 'Torque station TS-6 audit',
    equipment: 'Torque station TS-6',
    category: 'Process',
    doc_type: 'Standard operating procedure',
    approved: 1,
    body: `Approved procedure for the daily torque audit at station TS-6.

Each click wrench is checked on the tester at the start of the shift. If the wrench releases early or late compared with the tester, tag it out and stop using it on assemblies. A calibration sticker from a previous quarter is also a tag-out, even if the click feels normal.

Maintenance replaces the tagged wrench with one that has a current sticker and a passing audit. Do not adjust the clutch on the line. Assemblies built with the failed wrench since the previous good audit are listed for quality review.

Record the wrench number, the tester reading, and the sticker date.`,
  },
  {
    document_code: 'WI-FP-006',
    title: 'Powder coat booth PC-1 finish defects',
    equipment: 'Powder coat booth PC-1',
    category: 'Quality',
    doc_type: 'Work instruction',
    approved: 1,
    body: `Approved work instruction for finish defects at powder coat booth PC-1.

Orange peel, a thick film on flat faces, or a light edge means the cart is held before pack-out.

Clean powder buildup off the hanging hooks so the parts are grounded. Check gun voltage against the posted setting for covers and lower it if the film is heavy on flat faces. Confirm the cure oven temperature is inside the posted window before the cart is released. Do not sand orange peel and send the cover on as finished.

Record the gun setting, whether the hooks were cleaned, and the oven temperature.`,
  },
];
