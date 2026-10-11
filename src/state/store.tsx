import {createContext,useContext,useEffect,useMemo,useReducer} from 'react'
import type {ReactNode,Dispatch} from 'react'
import type {State,Decision,Cat} from '../domain/types'
import {seed} from '../domain/seed'
import {summary} from '../domain/selectors'
import type {Summary} from '../domain/selectors'
import {apply,nextDay,charge} from '../domain/simulate'
export type Action={t:'log';label:string;amount:number;cat:Cat;need:boolean}|{t:'next'}|{t:'commit';d:Decision}|{t:'income';amount:number}|{t:'reset'}
const KEY='runway-v1'
function isValid(v:any):v is State{
 return Boolean(v&&typeof v==='object'&&
  typeof v.day==='number'&&
  typeof v.balance==='number'&&
  typeof v.nextId==='number'&&
  Array.isArray(v.txs)&&
  Array.isArray(v.bills)&&
  Array.isArray(v.goals)&&
  Array.isArray(v.habits))}
function load():State{
 try{
  const dayParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('day') : null
  if(dayParam === '30'){
    let st = seed()
    while(st.day < 30){ st = nextDay(st) }
    return st
  }
  const r=localStorage.getItem(KEY)
  if(r){const p=JSON.parse(r);if(isValid(p))return p}
 }catch{}
 return seed()}
function reducer(s:State,a:Action):State{
 switch(a.t){
  case 'log':return charge(s,a.amount,a.cat,a.label,a.need)
  case 'next':return nextDay(s)
  case 'commit':return apply(s,a.d)
  case 'income':return{...s,balance:s.balance+a.amount}
  case 'reset':return seed()
  default:return s}}
const Ctx=createContext<{s:State;sum:Summary;dispatch:Dispatch<Action>}|null>(null)
export function Provider({children}:{children:ReactNode}){
 const [s,dispatch]=useReducer(reducer,undefined,load)
 useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(s))}catch{}},[s])
 const sum=useMemo(()=>summary(s),[s])
 return <Ctx.Provider value={{s,sum,dispatch}}>{children}</Ctx.Provider>}
export const useApp=()=>{const c=useContext(Ctx);if(!c)throw new Error('Provider missing');return c}
