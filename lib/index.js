/**
 * @module smodel
 **/


/**
 * @private
 * @const ATTRIBUTE_TYPES
 * @type Object
 **/
var ATTRIBUTE_TYPES = {
    'blob': {
         // A "binary large object" containing binary data.	         
    },
    'bool': {
        // A Boolean value: either true or false.	
    },
    'byte': {
        // A sequence of 8 bits.
    },
    'date': {
        // If the Date only property is selected for this attribute type, 
        // the date value will include only the "MM/DD/YYYY" format (e.g., "10/05/2010"). 
        // Otherwise, the date value including the time, stored in UTC. 
        // The date is expressed in the following format: YYYY-MM-DDTHH:MM:SSZ 
        // (e.g., "2010-10-05T23:00:00Z" for October 5, 2010 in the Central European Timezone).
    },
    'duration': {
        // A duration between two dates	
    },
    'image': {
        // A reference to an image file or an actual image.
    },
    'long': {
        // A whole number, greater than or equal to a standard number
        // -2,147,483,648 to 2,147,483,647
    },
    'long64': {
        // A whole number, greater than or equal to a standard number 
        // -9,223,372,036,854,775,808 to +9,223,372,036,854,775,807
    },
    'number': {
        // A numeric value, corresponding either to a Real, and Integer or Long Integer.
        // ±1.7e±308 (real), -32,768 to 32,767 (integer), -2^31 to (2^31)-1 (long)
		minValue: "1",
		maxValue: "5",
		defaultValue: "3",
		defaultFormat: [
			{
				presentation: "slider",
				locale: "us",
				format: "d-m",
				sliderMin: "1",
				sliderMax: "5",
				sliderInc: "1"
			}
		],
		autosequence: false,
		unique: false,
		not_null: false,
		identifying: false,
		indexKind: "cluster"
    },
    'string': {
        // A sequence of characters.
    },
    'uuid': {
        // Universally Unique Identifier: a 16 bytes (128 bits) number containing 32 hexadecimal characters	
    },
    'word': {
        // A 16-bit signed integer -32767 to 32768
    },
    'object': {
        // A pure JavaScript object containing any kind of property/value pairs, including arrays.
        // This data type can be indexed. Functions and recursive references are not supported
        // Example: {x:2,y:"blue",z:{a:1, b:2}}
    }
};


/**
 * @method $model
 * @param {Object} model
 * @param {Array} dataClasses
 * @param {string} scope
 * @return SmartModel
 **/
exports.$model = function $model(model, dataclasses, scope) {
    return new this.SmartModel(model, dataclasses, scope); 
};

/**
 * @property SmartModel
 * @type Function
 **/
exports.SmartModel = null; // see SmartModel class definition 


/**
 * @method $class
 * @param {Object} module
 * @param {string} entityName
 * @param {string} collectionName
 * @param {string} scope
 * @return SmartClass
 **/
exports.$class = function $class(module, entityName, collectionName, scope) {
    module.exports = new this.SmartClass(module, entityName, collectionName, scope); 
    ['name', 'className', 'collectionName', 'attributes'].forEach(function(e) {
        module.exports[e] = module.exports.dataClass[e];
    }); 
    return module.exports;
};


/**
 * @property SmartClass
 * @type Function
 **/
exports.SmartClass = null; // see SmartClass class definition 


/**
 * @method $attr
 * @param {Object} module
 * @param {string} name
 * @param {string} param type or Class or Path
 * @param {Object} options
 * @return SmartAttribute
 **/
exports.$attr = function $attr(module, name, param, options) {
    module.exports = new this.SmartAttribute(name, param, options);
    return module.exports;
};


/**
 * @property SmartAttribute
 * @type Function
 **/
exports.SmartAttribute = null; // see SmartAttribute class definition 




/**
 * @class SmartModel
 * @constructor
 * @param {Object} model
 * @param {Array} dataClasses
 * @param {Object} options
 **/
exports.SmartModel = function SmartModel(model, dataclasses, options) {

    options = options || {};

    /**
     * @property dataClasses
     * @type Array
     **/
    this.model = model;

    /**
     * @property dataClasses
     * @type Array
     **/
    this.dataClasses = [];

    if (options.global) {
        model.publishAsJSGlobal = true;
    }
};


/**
 * @method $class
 * @param {string} entityName
 * @param {string} collectionName
 * @param {string} scope
 * @param {Object} options
 * @return SmartClass
 **/
exports.SmartModel.prototype.$class = function $class(entityName, collectionName, scope, options) {

    var 
        customModule,
        smartClass;

    customModule = {
        id: (typeof module === 'object') ? module.id : (application.getFolder().path + 'model'),
        exports: {}
    };

    smartClass = new this.SmartClass(customModule, entityName, collectionName, scope, options);
    
    smartClass.smartModel = this;
    
    return smartClass;
};


/**
 * @class SmartClass
 * @constructor
 * @param {Object} module
 * @param {string} entityName
 * @param {string} collectionName
 * @param {string} scope
 * @param {Object} options
 * @see http://doc.wakanda.org/home2.en.html#/Model/DatastoreClass-Constructor/DataClass.301-995600.en.html
 **/
exports.SmartClass = function SmartClass(module, entityName, collectionName, scope, options) {

    if(collectionName instanceof Object) {
        options = collectionName;
        collectionName = undefined;
    } 

    if(scope instanceof Object) {
        options = scope;
        scope = undefined;
    } 

    if(!(options instanceof Object)) {
        options = {};
    }


    /**
     * @property dataClass
     * @type DataClass
     **/
    this.dataClass = {
        name: entityName,
        className: entityName,
        collectionName: collectionName || (entityName + 'Collection'),
        scope: scope || 'public',
        attributes: []
    };

    // create default primary key
    this.$primary('ID', 'uuid');

    /**
     * @property sattributes
     * @type Array
     **/
    this.sattributes = [];

    /**
     * This array store submitted attributes which kind has not been yet identified 
     * It happens when the provided type an Entity or Collection name a of class
     * which definition is not yet loaded
     *
     * @property defferedAttributes
     * @type Array
     **/
    this.defferedAttributes = [];
};




/**
 * @private
 * @param {string} param
 * return {boolean}
 **/
function isType(param) {
    return ATTRIBUTE_TYPES.hasOwnProperty(param);
}


/**
 * @private
 * @param {string} param
 * return {boolean}
 **/
function isAlias(param) {
    return param.split('.').length > 0;
}


/**
 * @private
 * @param {string} param
 * return {boolean}
 **/
function isCalculated(param, options) {
}


/**
 * @private
 * @param {string} param
 * return {boolean}
 **/
function isOptions(param) {
    //return ['unique', 'autosequence'].indexOf(param) !== -1;
}


/**
 * @private
 * @param {string} param
 * return {boolean}
 **/
function isClassName(param) {
}


/**
 * @private
 * @param {string} param
 * return {boolean}
 **/
function isCollectionClassName(param) {
}


/**
 * @method $attr
 * @param {string} name
 * @param {string} param type or Class or Path
 * @param {Object} options
 * @return SmartClass
 **/
exports.SmartClass.prototype.$attr = function $attr(name, param, options) {

    this.dataClass.attributes.push(new this.SmartAttribute(name, param, options));
    return this;
};


/**
 * @method $primary
 * @param {Attribute} attr
 **/
exports.SmartClass.prototype.$primary = function $primary(attr, type) {

    //FIXME : delete primary key if it is already defined
    //        set option autosequence: true if type is number
    

    var options = { unique: true, primKey: true };
    if(type === 'uuid' || type === 'long') {
        options.autogenerate = true;
    }
    this.$attr(attr, type, options);
    return this;
};


function getAliasTargetType() {

}

function isIndexType() {
}


/**
 * @class SmartAttribute
 * @constructor
 * @param {string} name
 * @param {string} param type or Class or Path
 * @param {Object} options
 * @see http://doc.wakanda.org/home2.en.html#/Model/Attribute-Constructor/Attribute.301-995679.en.html
 **/
exports.SmartAttribute = function SmartAttribute(name, param, options) {
    name = String(name);
    param = param || 'string';
    options = options || {};

    var scope = 'public';
    if (isOptions(options)) {
        scope = options.scope || scope;
    }

    this.attribute = {
        name: name,
        scope: scope
    };

    if (isType(param)) {

        // STORAGE ATTRIBUTE
        this.attribute.kind = 'storage';
        this.attribute.type = param;
        if (isIndexType(options)) {
            this.attribute.indexType = options;
        } else if (isIndexType(options.indexType)) {
            this.attribute.indexType = options.indexType;
        }

    } else if (isAlias(param)) {

        // STORAGE ATTRIBUTE
        this.attribute.kind = 'alias';
        this.attribute.path = param;
        this.attribute.type = getAliasTargetType(this);

    } else if (isCalculated(param)) {

        // CALCULATED ATTRIBUTE
        this.attribute.kind = 'calculated';
        this.attribute.type = param.substr(1);

    } else if (isClassName(param)) {

        // ENTITY ATTRIBUTE
        this.attribute.kind = 'relatedEntity';
        this.attribute.type = param;
        this.attribute.path = param;

    } else if (isClassName(param)) {

        // COLLECTION ATTRIBUTE
        this.attribute.kind = 'relatedEntities';
        this.attribute.type = param;
        this.attribute.path = options;
        this.attribute.reversePath = true;

    }
    
    if (this.attribute.kind) {

        if (isOptions(param)) {
            options = param;
        }

        // TODO: parse options to add them to the attribute
        if (isOptions(options)) {
        }

       Object.keys(options).forEach(function(e) {
           if((this.attribute.kind === 'storage') && (e === 'unique' || e === 'autogenerate' || e === 'primKey')) {
               this.attribute[e] = options[e];
           }
       }, this);

    } else {
        // add to defer creation list
        // usualy happen when:
        // - related Class is not yet define 
        // - or an alias path is not yet valid
        this.defferedAttributes.push([name, param, options]);
    }
};

exports.SmartModel.prototype.SmartClass = exports.SmartClass;
exports.SmartClass.prototype.SmartAttribute = exports.SmartAttribute;
