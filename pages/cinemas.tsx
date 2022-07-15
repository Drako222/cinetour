/** @jsxImportSource @emotion/react */

import { css } from '@emotion/react';
import { GetServerSidePropsContext } from 'next';
import { AppContextType } from 'next/dist/shared/lib/utils';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { colors } from '../styles/constants';
import { getUserByValidSessionToken, Programme, User } from '../utils/database';
import { getReducedProgramme } from '../utils/datastructures';

const cinemasStyles = css`
  .filter {
    padding: 10px;
    padding-bottom: 2rem;
    display: flex;
    justify-content: space-around;
    border-bottom: 3px solid white;
  }

  button {
    margin: 0;
  }

  h3 {
    margin: 0;
    padding: 0;
  }

  li {
    color: white;
    border-bottom: 3px solid white;
  }

  a {
    color: ${colors.blue};

    :hover {
      color: white;
    }
  }

  .tours {
    text-align: end;
    padding: 0;
    margin: 0;
  }

  .englishswitc {
    margin-bottom: 10px;
    padding: 10px;
    align-self: center;
  }
`;

type Props = {
  programmes: any;
  cinemas: string[];
  films: string[];
  loggedUser: User | null;
};

export default function Cinemas(props: Props) {
  const [day, setDay] = useState('');
  const [cinema, setCinema] = useState('');
  const [film, setFilm] = useState('');
  const [english, setEnglish] = useState(false);
  const [programmes, setProgrammes] = useState(props.programmes);

  // getting days from now
  const today = new Date(Date.now()).toString().split(' ', 3).join(' ');
  const tomorrow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
    .toString()
    .split(' ', 3)
    .join(' ');
  const day2 = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    .toString()
    .split(' ', 3)
    .join(' ');

  const sevenDays = [today, tomorrow, day2];

  const handleFilter = (data: any, key: any, value: any) => {
    return data.filter((item: any) => item[key] === value);
  };

  const renderData = (data: any) => (
    <ul>
      {sevenDays.map((day) => (
        <li>
          <div className="date">
            <h2>{day}</h2>
          </div>
          {data
            .filter((item: any) => item.date === day)
            .sort((a: any, b: any) => a.time.localeCompare(b.time))
            .map((item: any) => (
              <div
                key={`programme_id-${item.programmeId}`}
                className="programme"
                id={item.programmeId}
              >
                <div>
                  <div className="flex">
                    <div>{item.time}</div>
                    <div>{item.cinemaName}</div>
                  </div>
                  <div>
                    <h3>
                      <Link href={`/films/${item.filmId}`}>
                        {item.filmTitle}
                      </Link>
                    </h3>
                  </div>
                </div>
                <div className="flex">
                  <div>#{item.genre}</div>
                  {item.englishfriendly ? <div>English Friendly</div> : ''}
                  <div>
                    Tours:{' '}
                    {item.username ? (
                      <Link href={`../tours#${item.tourId}`}>
                        <button>{item.username}</button>
                      </Link>
                    ) : props.loggedUser ? (
                      <Link href={`/tours/create/${item.programmeId}`}>
                        <button>+</button>
                      </Link>
                    ) : (
                      <Link href={`../tours#${item.tourId}`}>
                        <button disabled>+</button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </li>
      ))}
    </ul>
  );

  const data = programmes;
  let filteredData = [...data];

  if (day) {
    filteredData = handleFilter(filteredData, 'date', day);
  }
  if (film) {
    filteredData = handleFilter(filteredData, 'filmTitle', film);
  }
  if (cinema) {
    filteredData = handleFilter(filteredData, 'cinemaName', cinema);
  }
  if (english) {
    filteredData = handleFilter(filteredData, 'englishfriendly', english);
  }

  return (
    <div>
      <Head>
        <title>Cinemas</title>
        <meta name="description" content="Cinemas, programme and search" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main css={cinemasStyles}>
        <div className="filter">
          <div>
            <label htmlFor="day">Day:</label>

            <select
              id="day"
              value={day}
              onChange={(event) => {
                setDay(event.currentTarget.value);
              }}
            >
              <option></option>
              {sevenDays.map((day) => (
                <option value={day}>{day}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cinema">Cinema:</label>
            <select
              id="cinema"
              value={cinema}
              onChange={(event) => {
                setCinema(event.currentTarget.value);
              }}
            >
              <option></option>
              {props.cinemas.map((cinema) => (
                <option>{cinema}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="film">Film:</label>
            <input
              type="text"
              list="films"
              value={film}
              onChange={(event) => setFilm(event.currentTarget.value)}
            />
            <datalist id="films">
              <option></option>
              {props.films.map((film) => (
                <option>{film}</option>
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="english">English Friendly:</label>
            <label className="switch">
              <input
                type="checkbox"
                id="english"
                checked={english}
                onChange={(event) => {
                  setEnglish(event.currentTarget.checked);
                }}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
        <div>
          {!!filteredData.length ? (
            renderData(filteredData)
          ) : (
            <p>Nothing found</p>
          )}
        </div>
      </main>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const baseUrl = await process.env.BASE_URL;
  const request = await fetch(`${baseUrl}/api/programmes`);

  const loggedUser = await getUserByValidSessionToken(
    context.req.cookies.sessionToken,
  );

  const programmesRaw = await request.json();

  // getting a better datastructure
  const programmes = programmesRaw.map((programme: Programme) =>
    getReducedProgramme(programme),
  );

  // filtering only a list of unique items for filter
  const cinemasRepeated = programmes.map(
    (programme: Programme) => programme.cinemaName,
  );
  const cinemas = cinemasRepeated.filter((element: string, index: number) => {
    return cinemasRepeated.indexOf(element) === index;
  });

  const filmsRepeated = programmes.map(
    (programme: Programme) => programme.filmTitle,
  );
  const films = filmsRepeated.filter((element: string, index: number) => {
    return filmsRepeated.indexOf(element) === index;
  });

  return {
    props: {
      programmes: programmes,
      cinemas: cinemas,
      films: films,
      loggedUser: loggedUser || null,
    },
  };
}