import NewsModel from '../models/news.js';
import Repository from '../models/repository.js';
import Controller from './Controller.js';

export default class NewsController extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new NewsModel()));
    }

    /* Http GET action */
    list() {
        this.HttpContext.response.JSON(
            this.repository.getAll(this.HttpContext.path.params, this.repository.ETag)
        );
    }
}