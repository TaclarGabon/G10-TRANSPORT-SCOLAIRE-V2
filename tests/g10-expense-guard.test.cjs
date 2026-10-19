'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {install,sameExpense,recentDuplicate}=require('../correctifs/g10-expense-guard-v1.js');

test('reconnaît une facture identique sans supprimer les autres',()=>{
  const a={type:'Carburant',date:'2026-10-19',amount:20000,odometer:3200,litres:20,vendor:'Station A'};
  assert.equal(sameExpense(a,{...a,id:'EXP-1'}),true);
  assert.equal(sameExpense(a,{...a,amount:21000}),false);
  assert.equal(recentDuplicate([{...a,enteredAt:new Date().toISOString()}],a,Date.now()),true);
  assert.equal(recentDuplicate([{...a,enteredAt:new Date().toISOString(),cancelledAt:'today'}],a,Date.now()),false);
});
test('bloque les triples clics pendant la compression asynchrone et une répétition accidentelle',async()=>{
  const now=new Date().toISOString();
  const values={type:'Carburant',date:'2026-10-19',amount:'20000',odo:'3200',litres:'20',vendor:'Station A'};
  let calls=0,confirms=0;
  const fields=Object.fromEntries(Object.entries(values).map(([k,v])=>['aexp_'+k,{value:v}]));
  const root={
    st:{vehicleExpenses:[]},expenseEditIdByCtx:{},expenseCtxPrefix:()=> 'aexp',
    document:{body:null,getElementById:(k)=>fields[k]||null},
    confirm:()=>{confirms++;return false},
    setInterval,clearInterval,setTimeout,clearTimeout,
    addExpenseV145:function(){
      calls++;
      setTimeout(()=>{root.st.vehicleExpenses.push({
        id:'EXP-1',type:'Carburant',date:'2026-10-19',amount:20000,odometer:3200,
        litres:20,vendor:'Station A',enteredAt:now
      })},180);
    }
  };
  // L'installateur lit "root" dans l'environnement browser. En Node,
  // la fonction exportée utilise globalThis, que l'on isole ci-dessous.
  const keys=Object.keys(root),backup={};
  for(const k of keys){backup[k]=globalThis[k];globalThis[k]=root[k]}
  delete globalThis.__g10ExpenseGuardInstalled;
  try{
    assert.equal(install(),true);
    globalThis.addExpenseV145('admin',false);
    globalThis.addExpenseV145('admin',false);
    globalThis.addExpenseV145('admin',true);
    assert.equal(calls,1);
    await new Promise(resolve=>setTimeout(resolve,430));
    globalThis.addExpenseV145('admin',false);
    assert.equal(calls,1);
    assert.equal(confirms,1);
    assert.equal(globalThis.st.vehicleExpenses.length,1);
  }finally{
    for(const k of keys){if(backup[k]===undefined)delete globalThis[k];else globalThis[k]=backup[k]}
    delete globalThis.__g10ExpenseGuardInstalled;
  }
});
