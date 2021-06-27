import { SyncHook } from 'tapable';
import Api from './api';

class Main {
	private status=''

  hooks = {
    init: new SyncHook(),
	afterPluginLoaded:'xxx',
	pluginReady:new SyncHook(),
	modifyWebpackConfgi: 'xxx',
	modifyBabelConfig:'xxx',
	modifyConfig:'xxx'
  };

  pluginManager=new PluginManager()

  init() {
    this.hooks.init.call();
    this.loadPlugins();
  }

  addInternalHook(){}


  receiveCommand() {
    //   todo
    // return ...
  }
}

class PluginManager{
	plugins = new Map();
	apis=new Map();

	constructor(private core:Main){}

	loadPlugins(){
		this.loadInternalPlugins();
		this.loadExternalPlugins()
	}
  
	loadInternalPlugins(){}
  
	loadExternalPlugins() {}
  
	loadPlugin(){}
}

class PluginApi{
	private methods=new Map();
	private hooks=new Map();

	addMethod(){}
	addHook(){}

	getPlugins(){
		
	}
}

export default (api: string) => {
  api.addMethod()

  api.hooks.pluginReady.tap('xxx', ({plugins:Map<any, any>})=>{
	  api.getPlugin('xxx').hooks
	  api.getPlugin('xxx').methods
  });

  return {
	  id:'xxx',
	  key:'xxx',
		afterPluginsLoaded(){},
	  pluginReady({plugins}){

	  },
	  webpack:{
		async modify(){

		},
		async modifyClientConfig(){

		}
	  },
	  babel:{
		  async modify(){
			  
		  }
	  },
	  dev:{
		  async modifyWebpackConfig(){
			return 'xxx'
		  },

	  },
	  'modifyWebpackConfig@dev':async ()=>{

	  }
	}

};
