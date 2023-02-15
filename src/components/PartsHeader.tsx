import { useState } from 'react'

type Props = {
  tabAction: (id: string) => void
}

export function PartsHeader(props: Props) {
  const [count, setCount] = useState(0);
  const tabAction = props.tabAction ?? (() => {});

  return (
    <header className="header">
      <div className="inner">
        <div className="logo"></div>
        <div className="nav">
          <nav className="nav flex">
            <p className="item p-1" onClick={() => tabAction('movie')}>movie</p>
            <p className="item p-1" onClick={() => tabAction('data')}>data</p>
            <p className="item p-1" onClick={() => tabAction('selectView')}>selectView</p>
          </nav>
        </div>
      </div>
    </header>
  )
}
