import type {State} from './types'
/** Persona: Aarav, college student in Delhi. Day 1 of 30, ₹10,000 pocket money. */
export const seed=():State=>({day:1,balance:9820,nextId:100,habits:[],
 txs:[{id:1,day:1,amount:120,cat:'Transport',label:'Metro card top-up',need:true},{id:2,day:1,amount:60,cat:'Food',label:'Chai + maggi',need:false}],
 bills:[
  {id:10,name:'Hostel mess share',amount:3000,due:5,paid:false,active:true,kind:'commitment'},
  {id:11,name:'Phone recharge',amount:299,due:10,paid:false,active:true,kind:'commitment'},
  {id:12,name:'Study loan EMI',amount:800,due:15,paid:false,active:true,kind:'commitment'},
  {id:13,name:'Netflix',amount:199,due:12,paid:false,active:true,kind:'subscription'},
  {id:14,name:'Spotify',amount:119,due:20,paid:false,active:true,kind:'subscription'},
  {id:15,name:'Gym',amount:499,due:25,paid:false,active:true,kind:'subscription'}],
 goals:[{id:20,name:'Goa trip fund',target:6000,saved:500,monthly:1500},{id:21,name:'Emergency buffer',target:5000,saved:0,monthly:1000}]})
export const SHOCKS=[{label:'Phone screen cracked',amount:2200},{label:'Friend’s wedding gift',amount:1200},{label:'Laptop charger died',amount:1500},{label:'Doctor visit',amount:800}]
