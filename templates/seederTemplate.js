import db from '../../app/models/modrels.js';

async function up({context: QueryInterface}) {
  if(db.Employee) {
    await db.Employee.bulkCreate([
 
    ]);
  }else {
    const now = new Date()
    await QueryInterface.bulkInsert('things', [

    ]);
  }
}

async function down({context: QueryInterface}) {
  await QueryInterface.bulkDelete('things', null, {});
}

export { up, down }
