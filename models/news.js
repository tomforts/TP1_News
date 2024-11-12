import Model from './model.js';

export default class News extends Model {
    constructor() {
        super(true /* secured Id */);

        this.addField('Id', 'string');
        this.addField('Title', 'string');
        this.addField('Text', 'string');
        this.addField('Category', 'string');
        this.addField('Image', 'asset');
        this.addField('Creation', 'integer');
              
        this.setKey("Id");
    }
}