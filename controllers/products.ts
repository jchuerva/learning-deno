// import interfaces
import { Product } from '../types.ts'
import { Client } from '../dependencies.ts'
import { dbCreds } from '../config.ts'

// init client
const client = new Client(dbCreds)

// functions

// @desc    Get all products
// @route   GET /api/v1/products
const getProducts = async ({ response }: { response: any }) => {
  try {
    await client.connect()

    const result = await client.query("SELECT * FROM products")
    // result gives a weird strtucture, so we have to format it
    // console.log(result)

    const products = new Array()
    result.rows.map(p => {
      let obj: any = new Object()

      result.rowDescription.columns.map((elm, i) => {
        obj[elm.name] = p[i]
      })

      products.push(obj)
    })

    response.status = 200
    response.body = {
      success: true,
      data: products
    }

  } catch (err) {
    response.status = 500
    response.body = {
      success: false,
      msg: err.toString()
    }
  } finally {
    await client.end()
  }
}

// @desc    Get single product
// @route   GET /api/v1/products/:id
const getProduct = async ({ params, response }: { params: { id: string }, response: any }) => {

  try {
    await client.connect()

    const result = await client.query("SELECT * FROM products WHERE id =$1", params.id)

    if (result.rows.toString() == "") {
      response.status = 404 // not found
      response.body = {
        success: false,
        msg: `No product with the id of ${params.id}`
      }
      return;
    } else {
      const product: any = new Object()

      result.rows.map(p => {
        result.rowDescription.columns.map((elm, i) => {
          product[elm.name] = p[i]
        })
      })
      response.body = {
        success: true,
        data: product
      }
    }
  } catch (err) {
    response.status = 500
    response.body = {
      success: false,
      msg: err.toString()
    }
  } finally {
    await client.end()
  }
}

// @desc    Add product
// @route   Post /api/v1/products
// need to add the async for the await request.body() promise
const addProduct = async ({ request, response }: { request: any, response: any }) => {
  // response.body = 'add'
  const body = await request.body()
  const product = body.value

  if (!request.hasBody) {
    response.status = 400
    response.body = {
      success: false,
      msg: 'No data'
    }
  } else {
    try {
      await client.connect()
      const result = await client.query("INSERT INTO products(name,description,price) VALUES($1,$2,$3)",
        product.name,
        product.description,
        product.price)

      response.status = 201
      response.body = {
        success: true,
        data: product
      }
    } catch (err) {
      response.status = 500 // server error
      response.body = {
        success: false,
        msg: err.toString()
      }
    } finally {
      await client.end()
    }
  }

}

// @desc    Update product
// @route   PUT /api/v1/products/:id
const updateProduct = async ({ params, request, response }: { params: { id: string }, request: any, response: any }) => {
  await getProduct({ params: { "id": params.id }, response })

  if (response.status === 404) {
    response.body = {
      success: false,
      msg: response.body.msg
    }
    response.status = 404
    return
  } else {
    console.log(response.body.data)
    const body = await request.body()
    const product = body.value

    if (!request.hasBody) {
      response.status = 400
      response.body = {
        success: false,
        msg: 'No data'
      }
    } else {
      try {
        await client.connect()

        const newData = {...response.body.data, ...product}

        const result = await client.query("UPDATE products SET name=$1, description=$2, price=$3 WHERE id=$4",
          newData.name,
          newData.description,
          newData.price,
          params.id)

        response.status = 200
        response.body = {
          success: true,
          data: newData
        }
      } catch (err) {
        response.status = 500
        response.body = {
          success: false,
          msg: err.toString()
        }
      } finally {
        await client.end()
      }
    }
  }
}

// @desc    Delete product
// @route   DELETE /api/v1/products/:id
const deleteProduct = async ({ params, response }: { params: { id: string }, response: any }) => {
  await getProduct({ params: { "id": params.id }, response })

  if (response.status === 404) {
    response.body = {
      success: false,
      msg: response.body.msg
    }
    response.status = 404
    return
  } else {
    try {
      await client.connect()

      const result = await client.query("DELETE FROM products WHERE id=$1", params.id)

      response.body = {
        success: true,
        msg: `Product with id ${params.id} has been deleted`
      }
      response.status = 204
    } catch (err) {
      response.status = 500
      response.body = {
        success: false,
        msg: err.toString()
      }
    } finally {
      await client.end()
    }
  }
}


export { getProducts, getProduct, addProduct, updateProduct, deleteProduct }