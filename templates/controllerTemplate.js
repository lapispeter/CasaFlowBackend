import Thing from '../models/thing.js'

const ThingController = {
    async index(req, res) {
        try {
            await ThingController.tryIndex(req, res)
        }catch(error) {
            res.status(500)
            res.json({
                success: false,
                message: 'Error! The query is failed!',
                error: error.message
            })
        }
    },
    async tryIndex(req, res) {
        const things = await Thing.findAll()
        res.status(200)
        res.json({
            success: true,
            data: things
        })
    },
    async show(req, res) {
        try {
            await ThingController.tryShow(req, res)
        }catch(error) {
            res.status(500)
            res.json({
                success: false,
                message: 'Error! The query is failed!',
                error: error.message
            })
        }
    },
    async tryShow(req, res) {
        const thing = await Thing.findByPk(req.params.id)
        res.status(200)
        res.json({
            success: true,
            data: thing
        })
    },
    async store(req, res) {
        try {
            await ThingController.tryStore(req, res)
        }catch(error) {
            res.status(500)
            res.json({
                success: false,
                message: 'Error! The query is failed!',
                error: error.message
            })
        }
    },
    async tryStore(req, res) {
        if(req.body.id) {
            delete req.body.id
        }        
        const thing = await Thing.create(req.body)
        res.status(201)
        res.json({
            success: true,
            data: thing
        })
    },
    async update(req, res) {
        try {
            await ThingController.tryUpdate(req, res)
        }catch(error) {
            let actualMessage = '';
            if(error.message == 'Fail! Record not found!') {
                actualMessage = error.message
                res.status(404)
            }else {
                res.status(500)
                actualMessage = 'Fail! The query is failed!'
            }
            
            res.json({
                success: false,
                message: actualMessage
            })
        }
    },
    async tryUpdate(req, res) {
        if(req.body.id) {
            delete req.body.id
        }        
        const recordNumber = await Thing.update(req.body, {
            where: { id: req.params.id }
        })
        if(recordNumber == 0) {
            throw new Error('Fail! Record not found!')
        }
        const thing = await Thing.findByPk(req.params.id)
        res.status(200)
        res.json({
            success: true,
            data: thing
        })
    },
    async destroy(req, res) {
        try {
            await ThingController.tryDestroy(req, res)
        }catch(error) {
            res.status(500)
            res.json({
                success: false,
                message: 'Error! The query is failed!',
                error: error.message
            })
        }
    },
    async tryDestroy(req, res) {
        const thing = await Thing.destroy({
            where: { id: req.params.id }
        })
        res.status(200)
        res.json({
            success: true,
            data: thing
        })
    }
}

export default ThingController