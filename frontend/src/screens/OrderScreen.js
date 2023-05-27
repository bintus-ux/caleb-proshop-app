import React from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { PaystackButton } from 'react-paystack'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Button,
  Row,
  Col,
  ListGroup,
  Image,
  Card,
  ListGroupItem,
} from 'react-bootstrap'
import { useDispatch, useSelector } from 'react-redux'
import Message from '../Components/Message'
import Loader from '../Components/Loader'
import { deliverOrder, getOrderDetails } from '../actions/orderActions'
import {
  ORDER_PAY_RESET,
  ORDER_DELIVER_RESET,
} from '../constants/orderConstants'

const OrderScreen = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  let { id } = useParams()

  const publicKey = 'pk_test_14f50da15f13068f9df8602205ba7da42702d2a9'
  const user = JSON.parse(localStorage.getItem('userInfo'))

  const orderDetails = useSelector((state) => state.orderDetails)
  const { order, loading, error } = orderDetails

  const orderPay = useSelector((state) => state.orderPay)
  const { loading: loadingPay, success: successPay } = orderPay

  // if (!loading) {
  //   // calculate prices
  //   const addDecimals = (num) => {
  //     return (Math.round(num * 100) / 100).toFixed(2)
  //   }

  //   order.itemsPrice = addDecimals(
  //     order.orderItems.reduce((acc, item) => acc + item.price * item.qty, 0)
  //   )
  // }

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  const orderDeliver = useSelector((state) => state.orderDeliver)
  const { loading: loadingDeliver, success: successDeliver } = orderDeliver

  useEffect(() => {
    if (!userInfo) {
      navigate('/login')
    }
    if (successDeliver) {
      dispatch({ type: ORDER_DELIVER_RESET })
    }

    dispatch({ type: ORDER_PAY_RESET })
    dispatch(getOrderDetails(id))
  }, [dispatch, successDeliver, userInfo, id, navigate])

  const deliverHandler = () => {
    dispatch(deliverOrder(order))
  }

  const componentProps = {
    email: user?.email || `null`,
    amount: parseInt(order?.totalPrice) * 100,
    metadata: {
      name: user?.name || `null`,
      phone: 123456789,
    },
    publicKey,
    text: 'Pay Now',
    onSuccess: (res) => {
      if (res.status === 'success') {
        const config = {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.token}`,
          },
        }
        const body = {
          reference: res.reference,
          id: order._id,
        }
        console.log(res)
        axios
          .post('/api/orders/pay', body, config)
          .then((resp) => {
            console.log(resp)
            window.location.reload()
          })
          .catch((err) => {
            console.log(err)
          })
      }
    },
    onClose: () => alert('try again!!!'),
  }

  return loading ? (
    <Loader />
  ) : error ? (
    <Message variant='danger'>{error}</Message>
  ) : (
    <>
      <h1>Order {order._id}</h1>
      <Row>
        <Col md={8}>
          <ListGroup variant='flush'>
            <ListGroupItem>
              <h2>Shipping</h2>
              <p>
                <strong>Name: </strong> {order.user.name}
              </p>
              <p>
                <strong>Email: </strong>{' '}
                <a href={`mailto:${order.user.email}`}>{order.user.email}</a>
              </p>
              <p>
                <strong>Address:</strong>
                {order.shippingAddress.address}, {order.shippingAddress.city},{' '}
                {order.shippingAddress.postalCode},{' '}
                {order.shippingAddress.country}
              </p>
              {order.isDelivered ? (
                <Message variant='success'>
                  Delivered on {order.deliveredAt}
                </Message>
              ) : (
                <Message variant='danger'>Not Delivered</Message>
              )}
            </ListGroupItem>
            <ListGroupItem>
              <h2>Payment Method</h2>
              <p>
                <strong>Method: </strong>
                {order.paymentMethod}
              </p>
              {order.isPaid ? (
                <Message variant='success'>Paid on {order.paidAt}</Message>
              ) : (
                <Message variant='danger'>Not Paid</Message>
              )}
            </ListGroupItem>

            <ListGroupItem>
              <h2>Order Items</h2>
              {order.orderItems.length === 0 ? (
                <Message>Order is empty</Message>
              ) : (
                <ListGroup variant='flush'>
                  {order.orderItems.map((item, index) => (
                    <ListGroupItem key={index}>
                      <Row>
                        <Col md={1}>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fluid
                            rounded
                          />
                        </Col>
                        <Col>
                          <Link to={`/product/${item.product}`}>
                            {item.name}
                          </Link>
                        </Col>
                        <Col md={4}>
                          {item.qty} x ${item.price} = ${item.qty * item.price}
                        </Col>
                      </Row>
                    </ListGroupItem>
                  ))}
                </ListGroup>
              )}
            </ListGroupItem>
          </ListGroup>
        </Col>
        <Col md={4}>
          <Card>
            <ListGroup variant='flush'>
              <ListGroupItem>
                <h2>Order Summery</h2>
              </ListGroupItem>
              <ListGroupItem>
                <Row>
                  <Col>Items</Col>
                  <Col>${order.itemsPrice}</Col>
                </Row>
              </ListGroupItem>
              <ListGroupItem>
                <Row>
                  <Col>Shipping</Col>
                  <Col>${order.shippingPrice}</Col>
                </Row>
              </ListGroupItem>
              <ListGroupItem>
                <Row>
                  <Col>Tax</Col>
                  <Col>${order.taxPrice}</Col>
                </Row>
              </ListGroupItem>
              <ListGroupItem>
                <Row>
                  <Col>Total</Col>
                  <Col>${order.totalPrice}</Col>
                </Row>
              </ListGroupItem>
              {!order.isPaid && (
                <ListGroup.Item>
                  <Row>
                    {loadingPay && <Loader />}
                    {error && <Message>{error}</Message>}
                    <PaystackButton {...componentProps} className='paystack' />
                  </Row>
                </ListGroup.Item>
              )}
              {loadingDeliver && <Loader />}
              {userInfo &&
                userInfo.isAdmin &&
                order.isPaid &&
                !order.isDelivered && (
                  <ListGroup.Item>
                    <Row>
                      <Button
                        type='button'
                        className='btn btn-block'
                        onClick={deliverHandler}>
                        Mark As Shipped
                      </Button>
                    </Row>
                  </ListGroup.Item>
                )}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default OrderScreen
