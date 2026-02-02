export class UsageInterval {
     timestamp_start!: string;
     timestamp_end!: string;
   
     import_kwh = 0;
     export_kwh = 0;
     controlled_import_kwh = 0;
   
     quality_flags: string[] = [];
   }
   