export type Cat='Food'|'Transport'|'Fun'|'Shopping'|'Bills'|'Shock'|'Habit'|'Other'
export type Risk='Low'|'Watch'|'High'|'Critical'
export interface Tx{id:number;day:number;amount:number;cat:Cat;label:string;need:boolean;oneOff?:boolean}
export interface Bill{id:number;name:string;amount:number;due:number;paid:boolean;active:boolean;kind:'commitment'|'subscription'}
export interface Goal{id:number;name:string;target:number;saved:number;monthly:number}
export interface Habit{id:number;label:string;perDay:number}
export interface State{day:number;balance:number;txs:Tx[];bills:Bill[];goals:Goal[];habits:Habit[];nextId:number}
export type Decision=
 |{kind:'purchase';label:string;amount:number;cat:Cat;need:boolean}
 |{kind:'subscription';label:string;amount:number}
 |{kind:'habit';label:string;perDay:number}
 |{kind:'pauseSub';id:number}
 |{kind:'goal';id:number;amount:number}
 |{kind:'shock';label:string;amount:number}
