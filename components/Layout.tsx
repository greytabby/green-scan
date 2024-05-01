import { Navbar, NavbarBrand } from 'flowbite-react';
import React, { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

const Layout: React.FC<Props> = (props) => (
  // <Header />
  <div>
    <Navbar fluid className='border-b m-2'>
      <NavbarBrand>
        <span className='self-center whitespace-nowrap text-xl font-bold dark:text-white'>
          Green Scan
        </span>
      </NavbarBrand>
    </Navbar>
    <div className='flex m-2'>{props.children}</div>
  </div>
);

export default Layout;
