import React, { PureComponent, Fragment } from 'react';
import { connect } from 'dva';
import moment from 'moment';
import {
  Row, Col, Card, Form, Input, Button, Table, notification,
  Popconfirm, Switch, Tag, Select, Divider
} from 'antd';

import StandardTable from '@/components/StandardTable';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';
import { routerRedux } from 'dva/router';
import router from 'umi/router';
import Link from 'umi/link';

const FormItem = Form.Item;

@connect()
@Form.create()
class CategoryList extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      selectedRows: [],
      loading: false,
      keyword: '',
      pageNum: 1,
      pageSize: 10,
      predicate: 'id',
      reverse: true,

      data: {
        list: [],
        pagination: {}
      }
    };
    this.handleChangeKeyword = this.handleChangeKeyword.bind(this);
  }

  columns = [
    {
      title: '操作',
      key: 'operation',
      fixed: 'left',
      // align: 'center',
      // width: 120,
      render: (text, record) => (
        <Fragment>
          <a onClick={() => this.handleEditCategory(text, record)}>修改</a>
          <Divider type="vertical" />
          <Popconfirm title="确定要删除吗？" onConfirm={() => this.handleDelete(text, record)}>
            <a href="javascript:;">删除</a>
          </Popconfirm>
        </Fragment>
      )
    },
    {
      title: '包括在菜单中',
      dataIndex: 'includeInMenu',
      fixed: 'left',
      // align: 'center',
      // width: 120,
      render: (val, record) => <Switch defaultChecked={val} onChange={checked => this.onSwitch(checked, record)} />
    },
    {
      title: 'ID',
      dataIndex: 'id',
      sorter: true,
      defaultSortOrder: 'descend',
      // width: 120,
    },
    {
      title: '名称',
      dataIndex: 'name',
      sorter: true,
      // width: 150,
      // render: (text) => <span className={styles.colname}>{text}</span>,
    },
    {
      title: '显示顺序',
      dataIndex: 'displayOrder',
      sorter: true,
      // width: 120,
    },
    {
      title: '是否发布',
      dataIndex: 'isPublished',
      sorter: true,
      // width: 120,
      render: (val) => <Switch checked={val} disabled />
    },
    {
      title: '创建时间',
      dataIndex: 'createdOn',
      sorter: true,
      width: 120,
      render: val => <span>{moment(val).format('YYYY-MM-DD')}</span>,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedOn',
      sorter: true,
      width: 120,
      render: val => <span>{moment(val).format('YYYY-MM-DD')}</span>,
    },

  ];


  onSwitch = (checked, record) => {
    this.setState({
      loading: true,
    });
    const { dispatch } = this.props;
    const params = {
      id: record.id,
    };

    // 提交之前修改
    record.includeInMenu = !record.includeInMenu;

    new Promise(resolve => {
      dispatch({
        type: 'category/switchCategory',
        payload: {
          resolve,
          params,
        },
      });
    }).then(res => {
      this.setState({
        loading: false,
      });
      // console.log(res);
      if (res.success === true) {
        this.handleSearch();
      } else {
        // 失败则重置
        record.includeInMenu = !record.includeInMenu;
        notification.error({
          message: res.message,
        });
      }
    });
  };

  handleChangeKeyword(event) {
    this.setState({
      keyword: event.target.value,
    });
  }

  handleStandardTableChange = (pagination, filtersArg, sorter) => {
    var firstPage = sorter.field != this.state.predicate;
    this.setState({
      pageNum: pagination.current,
      pageSize: pagination.pageSize
    }, () => {
      if (sorter.field) {
        this.setState({
          predicate: sorter.field,
          reverse: sorter.order == 'descend'
        }, () => {
          if (firstPage)
            this.handleSearchFirst();
          else
            this.handleSearch();
        });
      } else {
        if (firstPage)
          this.handleSearchFirst();
        else
          this.handleSearch();
      }
    });
  };

  handleSearchFirst = () => {
    this.setState({
      pageNum: 1
    }, () => {
      this.handleSearch();
    });
  }

  handleSearch = () => {
    this.setState({
      loading: true,
    });
    const { dispatch } = this.props;
    const params =
    {
      pagination: {
        current: this.state.pageNum,
        pageSize: this.state.pageSize
      },
      search: {
        predicateObject: {
          name: this.state.keyword
        }
      },
      sort: {
        predicate: this.state.predicate,
        reverse: this.state.reverse
      }
    };

    new Promise(resolve => {
      dispatch({
        type: 'category/queryCategory',
        payload: {
          resolve,
          params,
        },
      });
    }).then(res => {
      if (res.success === true) {
        this.setState({
          loading: false,
          data: res.data
        });
      } else {
        notification.error({
          message: res.message,
        });
      }
    });
  };

  handleDelete = (text, record) => {
    this.setState({
      loading: true,
    });
    const { dispatch } = this.props;
    const params = {
      id: record.id,
    };
    new Promise(resolve => {
      dispatch({
        type: 'category/delCategory',
        payload: {
          resolve,
          params,
        },
      });
    }).then(res => {
      this.setState({
        loading: false,
      });
      // console.log(res);
      // 字符串无法识别，再次转换一下，原因未知？？
      var result = JSON.parse(res);
      if (result.success === true) {
        this.handleSearch();
      } else {
        notification.error({
          message: result.message,
        });
      }
    });
  };

  handleAddCategory = () => {
    router.push('/catalog/category/add');
  }

  handleEditCategory = (text, record) => {
    router.push({
      pathname: '/catalog/category/edit',
      query: {
        id: record.id,
      },
    });
  }

  componentDidMount() {
    this.handleSearchFirst();
  }

  renderSimpleForm() {
    return (
      <Form layout="inline" style={{ marginBottom: '20px' }}>
        <Row gutter={{ md: 8, lg: 24, xl: 48 }}>
          <Col md={24} sm={24}>
            <FormItem>
              <Input
                placeholder="名称"
                value={this.state.keyword}
                onChange={this.handleChangeKeyword} />
            </FormItem>
            <span>
              <Button
                onClick={this.handleSearchFirst}
                style={{ marginTop: '3px' }}
                type="primary"
                icon="search">
                查询</Button>
            </span>
            <span>
              <Button
                style={{ marginTop: '3px', marginLeft: '20px' }}
                onClick={this.handleAddCategory}
                type="primary"
                icon="plus">
                新增</Button>
            </span>
          </Col>
        </Row>
      </Form>
    );
  }

  render() {
    const { pageNum, pageSize } = this.state;
    const pagination = {
      showQuickJumper: true,
      showSizeChanger: true,
      pageSizeOptions: ['5', '10', '50', '100'],
      defaultPageSize: pageSize,
      defaultCurrent: pageNum,
      current: pageNum,
      pageSize: pageSize,
      total: this.state.data.pagination.total || 0,
      showTotal: (total, range) => {
        return `${range[0]}-${range[1]} 条 , 共 ${total} 条`;
      }
    };

    return (
      <PageHeaderWrapper title="商品分类">
        <Card bordered={false}>
          <div className="">
            <div className="">{this.renderSimpleForm()}</div>
            {/* <Table
              pagination={pagination}
              loading={this.state.loading}
              rowKey={record => record.id}
              columns={this.columns}
              bordered
              dataSource={list}
              onChange={this.handleStandardTableChange}
              scroll={{ x: 800 }} /> */}

            <StandardTable
              pagination={pagination}
              loading={this.state.loading}
              data={this.state.data}
              rowKey={record => record.id}
              columns={this.columns}
              bordered
              onChange={this.handleStandardTableChange}
              scroll={{ x: 1000 }}
            />
          </div>
        </Card>
      </PageHeaderWrapper>
    );
  }
}

export default CategoryList;
