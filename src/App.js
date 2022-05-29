import React, {
  useContext, useEffect, useRef, useState,
} from 'react';
import 'antd/dist/antd.css';
import './index.css';
import {
  Button, Form, Input, message, Table, Skeleton, Card,
} from 'antd';
import axios from 'axios';
import { CheckOutlined, ReadOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';

const { Meta } = Card;

const EditableContext = React.createContext(null);

function EditableRow({ index, ...props }) {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
}
EditableRow.propTypes = {
  index: PropTypes.number,
};
EditableRow.defaultProps = {
  index: undefined,
};

function EditableCell({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  const form = useContext(EditableContext);

  useEffect(() => {
    if (editing) {
      inputRef.current.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({
      [dataIndex]: record[dataIndex],
    });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      message.error('Save failed:', errInfo);
    }
  };

  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{
          margin: 0,
        }}
        name={dataIndex}
        rules={[
          {
            required: true,
            message: 'Required',
          },
        ]}
      >
        <Input
          type="number"
          maxLength={1}
          ref={inputRef}
          onPressEnter={save}
          onBlur={save}
          // min={-9}
          // max={9}
        />
      </Form.Item>
    ) : (
      <div
        role="textbox"
        tabIndex={0}
        className="editable-cell-value-wrap"
        style={{
          paddingRight: 24,
        }}
        onClick={toggleEdit}
      >
        {children}
      </div>
    );
  }

  return <td {...restProps}>{childNode}</td>;
}
EditableCell.propTypes = {
  title: PropTypes.string,
  editable: PropTypes.bool.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  children: PropTypes.array.isRequired,
  dataIndex: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  record: PropTypes.object.isRequired,
  handleSave: PropTypes.func.isRequired,
};

EditableCell.defaultProps = {
  title: null,
};

function buildPuzzle(puzzleObject, objectType = 'vast-chamber') {
  const puzzleData = [];
  for (let puzzleIndex = 0; puzzleIndex < 9; puzzleIndex += 1) {
    let puzzleRow;
    if (objectType === 'vast-chamber') {
      puzzleRow = {
        key: puzzleIndex,
        A: puzzleObject[`A${puzzleIndex + 1}`] !== undefined ? puzzleObject[`A${puzzleIndex + 1}`] : '.',
        B: puzzleObject[`B${puzzleIndex + 1}`] !== undefined ? puzzleObject[`B${puzzleIndex + 1}`] : '.',
        C: puzzleObject[`C${puzzleIndex + 1}`] !== undefined ? puzzleObject[`C${puzzleIndex + 1}`] : '.',
        D: puzzleObject[`D${puzzleIndex + 1}`] !== undefined ? puzzleObject[`D${puzzleIndex + 1}`] : '.',
        E: puzzleObject[`E${puzzleIndex + 1}`] !== undefined ? puzzleObject[`E${puzzleIndex + 1}`] : '.',
        F: puzzleObject[`F${puzzleIndex + 1}`] !== undefined ? puzzleObject[`F${puzzleIndex + 1}`] : '.',
        G: puzzleObject[`G${puzzleIndex + 1}`] !== undefined ? puzzleObject[`G${puzzleIndex + 1}`] : '.',
        H: puzzleObject[`H${puzzleIndex + 1}`] !== undefined ? puzzleObject[`H${puzzleIndex + 1}`] : '.',
        I: puzzleObject[`I${puzzleIndex + 1}`] !== undefined ? puzzleObject[`I${puzzleIndex + 1}`] : '.',
      };
    } else {
      puzzleRow = {
        key: puzzleIndex,
        A: puzzleObject[puzzleIndex][0] !== 0 ? puzzleObject[puzzleIndex][0] : '.',
        B: puzzleObject[puzzleIndex][1] !== 0 ? puzzleObject[puzzleIndex][1] : '.',
        C: puzzleObject[puzzleIndex][2] !== 0 ? puzzleObject[puzzleIndex][2] : '.',
        D: puzzleObject[puzzleIndex][3] !== 0 ? puzzleObject[puzzleIndex][3] : '.',
        E: puzzleObject[puzzleIndex][4] !== 0 ? puzzleObject[puzzleIndex][4] : '.',
        F: puzzleObject[puzzleIndex][5] !== 0 ? puzzleObject[puzzleIndex][5] : '.',
        G: puzzleObject[puzzleIndex][6] !== 0 ? puzzleObject[puzzleIndex][6] : '.',
        H: puzzleObject[puzzleIndex][7] !== 0 ? puzzleObject[puzzleIndex][7] : '.',
        I: puzzleObject[puzzleIndex][8] !== 0 ? puzzleObject[puzzleIndex][8] : '.',
      };
    }

    puzzleData.push(puzzleRow);
  }
  // puzzleData.reverse();
  return puzzleData;
}

function buildPuzzleArray(puzzleDataSource) {
  const puzzleArray = [];
  for (let puzzleIndex = 0; puzzleIndex < puzzleDataSource.length; puzzleIndex += 1) {
    const puzzleRow = [
      Number(puzzleDataSource[puzzleIndex].A),
      Number(puzzleDataSource[puzzleIndex].B),
      Number(puzzleDataSource[puzzleIndex].C),
      Number(puzzleDataSource[puzzleIndex].D),
      Number(puzzleDataSource[puzzleIndex].E),
      Number(puzzleDataSource[puzzleIndex].F),
      Number(puzzleDataSource[puzzleIndex].G),
      Number(puzzleDataSource[puzzleIndex].H),
      Number(puzzleDataSource[puzzleIndex].I),
    ];
    puzzleArray.push(puzzleRow);
  }
  return puzzleArray;
}

function App() {
  const [dataSource, setDataSource] = useState([]);
  const [isDataFetchingDone, setIsDataFetchingDone] = useState(false);
  // const [count, setCount] = useState(9);
  const [difficulty, setDifficulty] = useState('random');
  const [gameStatus, setGameStatus] = useState('unsolved');
  const [loading, setLoading] = useState(false);
  const [isLoad, setIsLoad] = useState(true);

  const validateData = () => {
    setLoading(true);
    const url = 'https://sugoku.herokuapp.com/validate';
    const data = {
      board: buildPuzzleArray(dataSource),
    };
    const selectedOptions = { headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' } };
    axios.post(url, data, selectedOptions)
      .then((res) => {
        if (res.status === 200) {
          setGameStatus(res.data.status);
        }
        setLoading(false);
      }).catch((error) => {
        message.error(`${error}`);
        setLoading(false);
      });
  };

  const checkDifficulty = () => {
    setLoading(true);
    const url = 'https://sugoku.herokuapp.com/grade';
    const data = {
      board: buildPuzzleArray(dataSource),
    };
    const selectedOptions = { headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' } };
    axios.post(url, data, selectedOptions)
      .then((res) => {
        if (res.status === 200) {
          setDifficulty(res.data.difficulty);
        }
        setLoading(false);
      }).catch((error) => {
        message.error(`${error}`);
        setLoading(false);
      });
  };

  const solveProblem = () => {
    setLoading(true);
    const url = 'https://sugoku.herokuapp.com/solve';
    const data = {
      board: buildPuzzleArray(dataSource),
    };
    const selectedOptions = { headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' } };
    axios.post(url, data, selectedOptions)
      .then((res) => {
        if (res.status === 200) {
          // setDifficulty(res.data.difficulty);
          setDataSource(buildPuzzle(res.data.solution, 'sugoku-subdomain'));
          setGameStatus(res.data.status);
          setLoading(false);
        }
      }).catch((error) => {
        message.error(`${error}`);
        setLoading(false);
      });
  };

  const censor = (censorVal) => {
    let i = 0;

    return (key, value) => {
      if (i !== 0 && typeof (censorVal) === 'object' && typeof (value) === 'object' && censorVal === value) { return '[Circular]'; }

      // seems to be a harded maximum of 30 serialized objects?
      if (i >= 29) {
        return '[Unknown]';
      }
      i += 1; // so we know we aren't using the original object anymore

      return value;
    };
  };
  const isEmpty = (data) => {
    if (typeof (data) === 'object') {
      if (JSON.stringify(data, censor(data)) === '{}' || JSON.stringify(data, censor(data)) === '[]') {
        return true;
      } if (!data) {
        return true;
      }
      return false;
    } if (typeof (data) === 'string') {
      if (!data.trim()) {
        return true;
      }
      return false;
    } if (typeof (data) === 'undefined') {
      return true;
    }
    return false;
  };

  const loadBoard = () => {
    if (difficulty === null || difficulty === '') {
      setDataSource([
        {
          key: '0', A: '.', B: '.', C: '.', D: '.', E: '.', F: '.', G: '.', H: '.', I: '.',
        },
        {
          key: '1', A: '.', B: '.', C: '.', D: '.', E: '.', F: '.', G: '.', H: '.', I: '.',
        },
        {
          key: '2', A: '.', B: '.', C: '.', D: '.', E: '.', F: '.', G: '.', H: '.', I: '.',
        },
        {
          key: '3', A: '.', B: '.', C: '.', D: '.', E: '.', F: '.', G: '.', H: '.', I: '.',
        },
        {
          key: '4', A: '.', B: '.', C: '.', D: '.', E: '.', F: '.', G: '.', H: '.', I: '.',
        },
        {
          key: '5', A: '.', B: '.', C: '.', D: '.', E: '.', F: '.', G: '.', H: '.', I: '.',
        },
        {
          key: '6', A: '.', B: '.', C: '.', D: '.', E: '.', F: '.', G: '.', H: '.', I: '.',
        },
        {
          key: '7', A: '.', B: '.', C: '.', D: '.', E: '.', F: '.', G: '.', H: '.', I: '.',
        },
        {
          key: '8', A: '.', B: '.', C: '.', D: '.', E: '.', F: '.', G: '.', H: '.', I: '.',
        },
      ]);
    } else {
      setLoading(true);
      // const url = 'https://sugoku.herokuapp.com/board';
      const url = 'https://vast-chamber-17969.herokuapp.com/generate';
      axios.get(url, {
        params: {
          difficulty,
        },
      })
        .then((res) => {
          if (Object.prototype.hasOwnProperty.call(res.data, 'puzzle')
          && Object.prototype.hasOwnProperty.call(res.data, 'difficulty')) {
            setDataSource(buildPuzzle(res.data.puzzle));
            setIsDataFetchingDone(true);
            setDifficulty(res.data.difficulty);
            // setCount(res.data.puzzle.length);
          } else if (Object.prototype.hasOwnProperty.call(res.data, 'board')) {
            setDataSource(buildPuzzle(res.data.board, 'sugoku-subdomain'));
            setIsDataFetchingDone(true);
            // setCount(res.data.board.length);
          }
          setIsLoad(false);
          setLoading(false);
        }).catch((error) => {
          message.error(`${error}`);
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    if (isLoad) {
      loadBoard();
    }
  }, [difficulty]);

  const defaultColumns = [
    {
      dataIndex: 'A',
      width: '11.11%',
      editable: true,
    },
    {
      dataIndex: 'B',
      width: '11.11%',
      editable: true,
    },
    {
      dataIndex: 'C',
      width: '11.11%',
      editable: true,
    },
    {
      dataIndex: 'D',
      width: '11.11%',
      editable: true,
    },
    {
      dataIndex: 'E',
      width: '11.11%',
      editable: true,
    },
    {
      dataIndex: 'F',
      width: '11.11%',
      editable: true,
    },
    {
      dataIndex: 'G',
      width: '11.11%',
      editable: true,
    },
    {
      dataIndex: 'H',
      width: '11.11%',
      editable: true,
    },
    {
      dataIndex: 'I',
      width: '11.11%',
      editable: true,
    },
  ];

  const handleSave = (row) => {
    const newData = [...dataSource];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, { ...item, ...row });
    setDataSource(newData);
  };

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };
  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col;
    }

    return {
      ...col,
      onCell: (record) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    };
  });

  return (
    <div className="App">
      <h1>suGOku</h1>
      { isEmpty(dataSource) && !isDataFetchingDone
          && (
            <Skeleton loading active>
              <Meta />
            </Skeleton>
          )}
      { !isEmpty(dataSource)
          && (
            <>
              <Table
                components={components}
                rowClassName={() => 'editable-row'}
                bordered
                dataSource={dataSource}
                columns={columns}
                pagination={false}
                showHeader={false}
                size="small"
                loading={loading}
              />
              <section>
                <h3> Generate: </h3>
                <Button
                  onClick={() => { setIsLoad(true); setDifficulty('easy'); }}
                  type="text"
                  style={{
                    marginBottom: 16,
                  }}
                >
                  Easy
                </Button>
                <Button
                  onClick={() => { setIsLoad(true); setDifficulty('medium'); }}
                  type="text"
                  style={{
                    marginBottom: 16,
                  }}
                >
                  Medium
                </Button>
                <Button
                  onClick={() => { setIsLoad(true); setDifficulty('hard'); }}
                  type="text"
                  style={{
                    marginBottom: 16,
                  }}
                >
                  Hard
                </Button>

                <Button
                  onClick={() => { setIsLoad(true); setDifficulty('random'); }}
                  type="text"
                  style={{
                    marginBottom: 16,
                  }}
                >
                  Random
                </Button>
                <Button
                  onClick={() => { setIsLoad(true); setDifficulty(''); }}
                  type="ghost"
                  style={{
                    marginBottom: 16,
                  }}
                >
                  Clear
                </Button>
              </section>

              <section>
                <Button
                  onClick={() => validateData()}
                  type="ghost"
                  style={{
                    marginBottom: 16,
                  }}
                >
                  <CheckOutlined />
                  {' '}
                  Validate
                </Button>
                <Button
                  type="text"
                  style={{
                    marginBottom: 16,
                    cursor: 'unset',
                  }}
                >
                  {gameStatus}
                </Button>
                <Button
                  onClick={() => checkDifficulty()}
                  type="ghost"
                  style={{
                    marginBottom: 16,
                  }}
                >
                  <ReadOutlined />
                  {' '}
                  Difficulty
                </Button>
                <Button
                  type="text"
                  style={{
                    marginBottom: 16,
                    cursor: 'unset',
                  }}
                >
                  {difficulty}
                </Button>
              </section>

              <section>
                <Button
                  onClick={() => solveProblem()}
                  type="ghost"
                  style={{
                    marginBottom: 16,
                    width: '25%',
                  }}
                >
                  Solve
                </Button>
              </section>
            </>
          )}
    </div>
  );
}

export default App;
