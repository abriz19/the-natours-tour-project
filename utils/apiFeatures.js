class APIfeatures{
    constructor(query, queryString){
        this.query = query;
        this.queryString = queryString;
    }

    filter(){
        // 1, FILTERING
        const queryObj = {...this.queryString};
        const excludeFields = ['limit', 'sort', 'fields', 'page'];
        excludeFields.forEach(el => {
           delete queryObj[el];
        });

        // 2, ADVANCED FILTERING
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)
        this.query.find(JSON.parse(queryStr));
        return this;
    }

    sort(){
        if(this.queryString.sort){
            let sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        }else{
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }

    fields(){
        if(this.queryString.fields){
            let fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        }else{
            this.query = this.query.select('-__v');
        }
        return this;
    }
    pagination(){
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 10;
        const skip = (page-1) * limit;
        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}
   
module.exports = APIfeatures;
