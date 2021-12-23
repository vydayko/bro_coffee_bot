const tokenClient = '5043386761:AAFx5ss4h-Qg9576Ey1Bk5zsgeQ__srS1c4';
const tokenAdmin = '5089621749:AAFnLKtEIOjTtQ5_hQbmZmUf6Tr0-mckIxo';
const { MongoClient } = require('mongodb');
const mongoClient = new MongoClient("mongodb://localhost:27017/");

const Telegraf = require('telegraf-develop');
const Composer = require('telegraf-develop/composer');
const session = require('telegraf-develop/session');
const Stage = require('telegraf-develop/stage');
const Markup = require('telegraf-develop/markup');
const WizardScene = require('telegraf-develop/scenes/wizard');
const path = require('path');

const MAX_ORDER_COUNT = 5;
const AVERAGE_TIME_INDEX = 2;
let ordersQtPerDay = 0;
let isOpenOrdering = true;

const pathImage = path.join(__dirname, '/images/AssetLightingScene03.pngBA84BAD3-AD83-47A5-9CC6-410FDD2FAD08Large.png');

const coffees = {
  espresso: {
    name: 'Espresso',
    key: 'espresso',
  },
  doppio: {
    name: 'Doppio',
    key: 'doppio',
  },
  americano: {
    name: 'Americano',
    key: 'americano',
  },
  americano_with_milk: {
    name: 'Americano with milk',
    key: 'americano_with_milk',
  },
  cappuccino: {
    name: 'Cappuccino',
    key: 'cappuccino',
  },
  latte: {
    name: 'Latte',
    key: 'latte',
  },
  flat_white: {
    name: 'Flat White',
    key: 'flat_white',
  },
  raf: {
    name: 'Raf Coffee',
    key: 'raf',
  },
  cocoa: {
    name: 'Cocoa',
    key: 'cocoa',
  },
};

const milks = {
  regular_milk: {
    name: 'Regular milk',
    key: 'regular_milk',
  },
  lactose_free_milk: {
    name: 'Lactose-free milk',
    key: 'lactose_free_milk',
  },
  coconut_milk: {
    name: 'Coconut milk',
    key: 'coconut_milk',
  },
  soy_milk: {
    name: 'Soy milk',
    key: 'soy_milk',
  },
  oat_milk: {
    name: 'Oat milk',
    key: 'oat_milk',
  },
  without_milk: {
    name: 'Without milk',
    key: 'without_milk',
  }
};

const syrups = {
  coconut_syrup: {
    name: 'Coconut',
    key: 'coconut_syrup',
  },
  hazelnut_syrup: {
    name: 'Hazelnut',
    key: 'hazelnut_syrup',
  },
  vanilla_syrup: {
    name: 'Vanilla',
    key: 'vanilla_syrup',
  },
};

const coffeesKeys = Object.keys(coffees);

(async () => {
  await mongoClient.connect();
  const database = mongoClient.db('coffee_bot');
  const orders = database.collection('orders');
  
  const stepHandler = new Composer()
  stepHandler.action(coffeesKeys, async (ctx) => {
    ctx.wizard.state.coffeeSetup.coffeeType = ctx.match;
    
    await ctx.reply('Step 2. Chose milk', Markup.inlineKeyboard([
      Markup.callbackButton(milks.regular_milk.name, milks.regular_milk.key),
      Markup.callbackButton(milks.lactose_free_milk.name, milks.lactose_free_milk.key),
      Markup.callbackButton(milks.coconut_milk.name, milks.coconut_milk.key),
      Markup.callbackButton(milks.soy_milk.name, milks.soy_milk.key),
      Markup.callbackButton(milks.oat_milk.name, milks.oat_milk.key),
      Markup.callbackButton(milks.without_milk.name, milks.without_milk.key),
    ], { columns: 2 }).extra());
    return ctx.wizard.next();
  })

  //  all other request
  stepHandler.use((ctx) => {
    ctx.replyWithMarkdown('I don`t understand you, please click on button');
  })
  
  const superWizard = new WizardScene('super-wizard',
    async (ctx) => {
      ctx.wizard.state.coffeeSetup = {};
      await ctx.replyWithPhoto({
        source: pathImage,
      });
      
      const ordersQt = await orders.countDocuments({ order_status: 'new' });
      
      if (ordersQt === 0) {
        isOpenOrdering = true;
      }
      
      if (ordersQt >= MAX_ORDER_COUNT || !isOpenOrdering) {
        isOpenOrdering = false;
        await ctx.replyWithMarkdown(`Sorry, now we hav many orders, please wait ${ordersQt * ordersQtPerDay} minutes and try again `);
      } else {
        await ctx.reply('Step 1. Chose your coffee', Markup.inlineKeyboard([
          Markup.callbackButton(coffees.espresso.name, coffees.espresso.key),
          Markup.callbackButton(coffees.doppio.name, coffees.doppio.key),
          Markup.callbackButton(coffees.americano.name, coffees.americano.key),
          Markup.callbackButton(coffees.cappuccino.name, coffees.cappuccino.key),
          Markup.callbackButton(coffees.latte.name, coffees.latte.key),
          Markup.callbackButton(coffees.flat_white.name, coffees.flat_white.key),
          Markup.callbackButton(coffees.raf.name, coffees.raf.key),
          Markup.callbackButton(coffees.cocoa.name, coffees.cocoa.key),
        ], { columns: 2 }).extra());
        return ctx.wizard.next();
      }
    },
    stepHandler,
    async (ctx) => {
      ctx.wizard.state.coffeeSetup.milkType = ctx.update.callback_query.data;
      
      ctx.reply('Step 3. Chose qt of sugar', Markup.inlineKeyboard([
        Markup.callbackButton(0, 0),
        Markup.callbackButton(1, 1),
        Markup.callbackButton(2, 2),
        Markup.callbackButton(3, 3),
        Markup.callbackButton(4, 4),
        Markup.callbackButton(5, 5),
      ], { columns: 2 }).extra());
      return ctx.wizard.next();
    },
    async (ctx) => {
      ctx.wizard.state.coffeeSetup.sugarQt = ctx.update.callback_query.data;
      
      ctx.reply('Step 4. Chose syrup', Markup.inlineKeyboard([
        Markup.callbackButton(syrups.coconut_syrup.name, syrups.coconut_syrup.key),
        Markup.callbackButton(syrups.vanilla_syrup.name, syrups.vanilla_syrup.key),
        Markup.callbackButton(syrups.hazelnut_syrup.name, syrups.hazelnut_syrup.key),
      ], { columns: 2 }).extra())
      return ctx.wizard.next();
    },
    async (ctx) => {
      ctx.wizard.state.coffeeSetup.syrupType = ctx.update.callback_query.data;
      ordersQtPerDay += 1;
      
      await orders.insertOne({
        coffee_type: ctx.wizard.state.coffeeSetup.coffeeType,
        milk_type: ctx.wizard.state.coffeeSetup.milkType,
        sugar_qt: ctx.wizard.state.coffeeSetup.sugarQt,
        syrup_type: ctx.wizard.state.coffeeSetup.syrupType,
        order_status: 'new',
        order_number: ordersQtPerDay,
      });

      ctx.reply(`Done, you order is:
        coffee = ${coffees[ctx.wizard.state.coffeeSetup.coffeeType].name},
        milk =  ${milks[ctx.wizard.state.coffeeSetup.milkType].name},
        sugar qt = ${ctx.wizard.state.coffeeSetup.sugarQt},
        syrup = ${syrups[ctx.wizard.state.coffeeSetup.syrupType].name}
      `);
      
      const ordersQt = await orders.countDocuments({ order_status: 'new' });
      ctx.reply(`We have ${ordersQt} active orders, you need to wait ${ordersQt * AVERAGE_TIME_INDEX} minutes =)`);
      ctx.reply('You get msg when you order will be ready');
      ctx.reply(`You order number is ${ordersQtPerDay}`);
  
      return ctx.scene.leave();
    }
  );
  
  const bot = new Telegraf(tokenClient);
  const stage = new Stage([superWizard], { default: 'super-wizard' });
  bot.use(session());
  bot.use(stage.middleware());
  await bot.launch();
})();
