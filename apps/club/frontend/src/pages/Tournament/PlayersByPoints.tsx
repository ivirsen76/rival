import { Fragment, useMemo } from 'react';
import style from './style.module.scss';
import { Link } from 'react-router-dom';
import Tooltip from '@rival/common/components/Tooltip';
import classnames from 'classnames';
import PlayerAvatar from '@/components/PlayerAvatar';
import PlayerName from '@/components/PlayerName';
import Modal from '@/components/Modal';
import TeamInfo from './TeamInfo';
import StopIcon from '@rival/common/metronic/icons/duotone/Code/Stop.svg?react';
import compareFields from '@rival/club.backend/src/utils/compareFields';
import dayjs from '@/utils/dayjs';
import { useSelector } from 'react-redux';
import getTotalProjectedPlayers from './getTotalProjectedPlayers';

const randomAvatars = [
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAABMCAMAAADugJGqAAAAhFBMVEVMaXHS2mjjuI3LwH3O4jrOxonVw43lt4pnRDeFc2VIOThcPDbUw4rN021LOThCNzpYPDhENTbL3VHJ2lxcTEbR5iXtuYpyQTMnKizN3FDVpnwfGRQzNTVIPzjEmnXgr4L39/fv8dtyXE1XUEqxwiFqY17L4CTB1CKxhmr8TmviTmPZ3L/QuPGWAAAAFXRSTlMA/vDM/jFi/v3+cN+S7DwaxpzlzcFdsz1SAAAACXBIWXMAAAsTAAALEwEAmpwYAAADLUlEQVRYhe2V27qiMAyFiyAHzzrTENkt1cIWdL//+83XUpCDSHHmctaFSGx+V9IUCPmvedrt/zL/uI5Xh91+90nu6rBeh3GldXyYnX+ok2ut5gH2615+HMfhrIas+g4qxgwfq1eAWbXsxgj2jPBVEeGcfhz1YpmktRIBAKJiHO1NSOgr1fHQuhNyQABINGNvWYd8QQAIQsuGHuI4fEmoGDbNWMdxOYKANLY6KeGoCQAI47UVQo4jIitEHKfjiNIOEY4TIJmHCDqbYa52vZC695EMQ6kmWw23+h7p+kKrHZERZ6jFpN7epA4wLvnvacKqWqyFiDyKsiagfzpOjfgKkWEWVfo2f47fdQAZ4tR8ugwZ+66lDSDyJsARMZpALJKSsUyJ8yzLMEvTCLm5yzKOMllMIAIIGOOcc1U75ygBSmTmjnOGKQSTCDDb8fWlPiOA9HmHiIkNIsOvWogpgMBWgIMNonymoFRTKZ/3WE4jFgBB1BjPEj1a/FlXADDVTl/Nc5mpfrCsTIwiBUEmUzXx/gSC+MqHUG+ARASg3wQJiCRJ00S/DBaTBEJI53QHQnROLFgAiGrHuKYaUclt1ovAyBx6AHCJjfymCH69VNJ7q2XTCdKqJORSi4fz6iBkUyeU3Kh5sWwsEaSxET3u9/v9Ec01QciyKb183O+PxkOwtEaQpqNdWfaykt+dp8rDLAIhy8GALWZUYbTpvoqs96Il332ejkC4M6sg/i+P0q065kIIoa5bSr1f9pjliSptdW4lsdWhk2U/lp5eTrf6qCsFABWCenaME20QTxkEPVkhqJHTRjh11IbgvkdMPzDcPL+Zxec24myCtzx/D1k6tzwv6j9szVZQx4o8vzlverrxqjVDGy0TBaXe5h2BthlOvxO1xzHGxsxD24euJeh60Nq8myiqIE0/vPPZexF+PWPn5mdKb8VPs4vNHv8UtTlt8M04VLpci3bGrSiuF9rRcG+97oLLVSUaiL72Ed6ECaoRHfURAxvn+YheN3w6H0G7T6DtJ4htB+F8gnDe7Qe1Qnj/GkE/QXSeYEsLhDPoF22fExvEC3UQ576uP4PQUBXiD1nS1dBk3UrrAAAAAElFTkSuQmCC',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAABMCAMAAADugJGqAAAAqFBMVEVMaXHny6HrwYDz1bH7u0zuzJbpyJv517Hvz6zFgQb01bDw0rDzxHHjyajuxoLipkLxxXr12bLNixn/27TKggDGgADAsqH/27T/pQD5tDbplwHNhADYjADlxKH//v30ngHfkwr9rRx1bGH8x3T99On8pQhSSED6wWP7zoj/3K3/3rr/5MawnYj80ptpW0zUtpWWembc29q2tbTjUGb6T2vXiH//T23vTmjTmRW8AAAAF3RSTlMAYyW+/hA4/P786HjXvYn7xEe7nH9b1M9seH0AAAAJcEhZcwAACxMAAAsTAQCanBgAAALkSURBVFiF7Zdrc6owEIa5g+Kltj2TjUrkJkiLd9v//9POkEBqACVwZs6nvh8cQrIPu8tuiIryq1/1lmYtFpZmKgNlurqNmHRXGwDQ3ip7prfeEFcEIIRstxfA1OsA6kgfwhihbL+LojQ1qNI02me9GK9z3/eXy80GmLabzXLp+/P5TJbwvlqt1xSx5YjN0l+vVyPZnI4qRBpQQhBFeEkRq1c5glYhtnEAOMriDNNACsRIrsreK0RKCCHxLihzQRF/pBCvFQLHJDN+0kkRcpGMeC7EN0IRo/+EMCnC9zE20ogpTQ2MeyAsf57usqIphA4p6jWa+1KVYVGT4yk8HEKH2TvF9elIry0JxAIh5IVh7jmOV/lQXOdhWIwXEggXIXTK2zo1PyGEXKkmRagMoC56e9xVoHq5+jMmJP5EbSO9A2GXNuQchjEprT5JHIbnamTLIWKSJ8mFxNXokiR5NZJGXIrncsQ5DC89ER8fP7/1kSTimboQY9SpcQdCFR/oUYmuqR0IxRX88I7H49ETfJD5IiHBD8cRO1YCoCjOvySCacrXO1z81lSRkcqdTs7FHk4IOdjSuWTiCT0kIVVy4H4pcnIrgzwpxbcP6QPCuLI4Xb9vt+/rqV8yC1k89K/r7Xb94smR2ThLqa2tYkvm8jGjH0FRrEa/OT2iYDKnYmHL1VRN05/usJ1BBGXqeR4rb8/zhiH0wrSUow9DIGTbhRO23f3xkDi+6v2O8urEiNrqIjImUqVhTjAA4LbqpBOTTnde2FETdk3Cjs0EL08BFj3g0YX7OmFfHoUBjCd1OitdaGPs7+dmMgSArRDLjvvwjDETCCJDJDxiWDUCAEQVIWpMBW35MBrLAFJGSFumjCbhpWUZgFEQ2uAAjXdrNsOgwhk7yTcV1Gts0r4OIHjABpjUEBh6C4sEtT8BQJWL45nESAwYIPG9BkMQYjK2QxBboSpgkO4rQxuGuP+HNBBx32oaHiTmxV9+RdZUqAvzaAAAAABJRU5ErkJggg==',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAABMCAMAAADugJGqAAAAhFBMVEVMaXF6UzVwQiWSb0qWkoq8qotrbGv21a/wzqqackTs0a93XEGYi3zPv6aDXTypopawpJqLTCbXupnMtJX/27QmLjO1gUOlVyhWW12XUyrlxaIiKi7XuJejdkq3imZpWkqiiW6rfVnNpoObYz2ym4JFS06SfWdPRDgzOT15aFVXSz2Ef3h8Zb3wAAAAFHRSTlMAhTPc0BD9/fvywGojZ7qQPers1e49A78AAAAJcEhZcwAACxMAAAsTAQCanBgAAALmSURBVFiF7ZjbkqIwEIajIARPM1PVTeSQcGZ09v3fbysJahCVhL3a2v0vtKDoz78PCSkJ+a9/Svvd0YuiKPKOq/0iwCqKDXkrZ8COxw+Kdo4W4ic6OnmIn8qzJ6yfE1x8RI+ht8LsFqbBy7C61tTJBB/CeAsAUDrZWKkfzqHkvBI5DMq5Q0WjOC5DmKpVkI0FYR3H9RPA1YlNJqu4ekGQTqz66sX0NQIim2JE/A0BSpu2ctXEV6q5BSJO3yFyGwQ3AkJVFmq0OLVBRAC07fu+LMu+UEm1hbro+5ZCaFMLj0JfDLqopNLL9boHmO/IhlYpQJor3apyv04rOjefW+BCRdGHqqZ6WkQF2xlECJUcTtoXxeW2xADyS1H0EsIrCOcRXFawDsPcWGxlHtJa1rYRFgjRvJuLvwZB5xF0BnEAkdwDwlTJQCQCDjMIcqgMhJ6pMWKWQMiKXeehShhjifq4bmQ1s9n41mwohoy9abDWsLUFgiRMbb8VS7gQNaW1EDxhykfNEhsC+dK+JaktlVoZqzP7skKspG/OZVD/rdRLIOcyM8uTSqLT5wDpjyT8pAB8KIkdgUgbjKmq5sX3dyE71Oh71selL/2LaofQg0W1M7tKSO11gKwgFUIu+eGGVUe11kNIXSfXT0cCIWudy0huBELIcTScjLGjzbFgrI1nQJLI1YLSNs0Fb5Kkaao8ndu2n2tL05voQgRAGFJK1St1EWKzNTe8rVsxD37QnadHhK4LfIsti5CNf0JEzCYHlRAzRDz5s3b8TgIQs+4R8UsSELHz3wI+A/0YYpYFY0KbDQjE4PM14WOwoBkn47VMgzsBsft4STjfn5KM7NTqld4GaBIQzx82BFSQDM9n9T0ivGJ8GlmYkGm8yuVZPQJ0UjAl+G4ExElvN0/SeK9u86cmcGLj5I44jQkHdwLi4U/zwIdMgiWIcV+7JYhuhDgvQZxHCFwkczL2yxDmfysLEeZS258WSbv4DX1LxwHGBTBrAAAAAElFTkSuQmCC',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAABMCAMAAADugJGqAAAAe1BMVEVMaXGXcUTEu7WKsNiPfmbSup/duJHot4qjeEfhupSluc2KaUWFaUl4YEW3vcNyW0XtuYpRmeS1gUP9/f13quLw7OjUpXverYHY1tOjgF9kUD2Ka1Ben+Shjny/lW/xxp+6u7/JnXVqpeJWVlayppwzIRy0jGiHfHPgz8C5LRoUAAAAEHRSTlMA7TH9Fmm//v7z0cysa4oybPQD7AAAAAlwSFlzAAALEwAACxMBAJqcGAAAAtdJREFUWIXNl3GTsiAQxjE1qK5rwUS5ytSs7/8Rb0BRSc3Ve/94n2lqNuA3zy4LGSH/v4LTqR+egoXLvzyh5R2OZuXxwIQ4LCF8MdGJeV4TfuEJBzEuhiZ4EwQhTtgsxKSQFT1NE9jfTRxwhGC6Eiz4K0EgN9X7QBDiiC4EUxMID2uCUSj67SkEkwxrIzDzEwAAqVizjCkJljm/J0c9LQMrKqU0PLAMD3U4FIzLMOab62AKMaFM25hFeNMmAIAhEdk0QiERdBpR4GrBpglAcTvCPiCAofpCdQuSpHu3CEx3KkjUpdaPwamfJlQJvDB3jqfg8mMlNUK24QWS+dMe7CgFkFmVpmm6a/aG7nRUZQa4m7t1tvWiexTFcRTdx6LtDGJXT4uj/PFIo9hGaS/azSCoXXR7PKoOUT0eNxtRLCKddIFE3COjJntwIiQCNCO2BLjHPR7FlRMA7i3gLZorZ+icCH3tSSndoxvOIEjY+dCNWRRFYTqq9TBLIIS4PpLE8TBXiFrWxuvW0wtZCKfHVRrXfa13I04Vrrv7Fc3SqI+I0vpGxVSCNJmo+E0Knwepbai4dRGbl1pgghgbsnITqeQCE4Rs9D5mN33P5FWV68+bLgXdoBEk1AxaZFn2fD6fWZYV5gt0Gi3DlOT5tC2xjEDIxjbY5WKbakEWjbZuY+N66k3b7nTQZBWBbPUDjpGUciUika3WugCgVJvQP06rEEFzYpsTuuw/Vbj385HHFJr7e1xr7M+c8/OQAFDqgf08oORG+ZCQ1yPlZ8jGr6dxfnVuYdOdVzvmf+jT73bWkNEROC+/MQTOr04uuTv2jSFwpx5NHWYYm6aQY4x3AuflWD38wTTO/ZowOjQk7EemNYwxAueDvQ2GaRidKR0n8DJAmeCcX9+LPGnjzBfr7BLC5QTOQ1wen+Rm4vMVcve1XIMoHcR1DeLqIPgq9QmbdYj+OfkXiPMq1YhfwE2r+H4DVowAAAAASUVORK5CYII=',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAABMCAMAAADugJGqAAAAYFBMVEVMaXGYkouhnZi+t7LMyMmtopWyn4j106/DrZCkmo2pqa3s0a+clYu1tLiSj4jUxbUmLTL/27To4eHs3L9aWlnix6gzNDJQSkR7dnDMs5bXvZ9tZ2BCREMiHhqZhnLd19iMPdDbAAAAEHRSTlMAPZT+/Gz6/f4eycDI4tzViVJSZAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAx1JREFUWIXtl9uWqjAMhgGhLY66EnqiLVPf/y33aosOKmiLt/u/cBGgH0lIQ6yq/ypT3X+5vjlfu2Pd78HUzfF4bq/DMFyvw/l6LF5/bIdHdWWA/vi0fhiGQ1Ek3bMHUW2BH12If0XXJpdQbxAK8tGuPL9NJ9s8QpOSR+VNlCIiTYy8UNpIwGfJNtuNep2ASA/hSp8Zx2GFgIiHzIQeh6FdJyC2eck4D4PdQshhyNkp7bYTIZRzFuLwLeI6yG2EzUNctwlI8xCHNwjMajxtRBjvhHB0fnY49iYctpkIMk5aBDkSlhEXjWkaCR5yEBei4U/h+QtT+9NHQB/WK+HcGDSBGkcFUzScEwoAxKdd8uPFBCIuGcdRAKGULG0t/M8HBKVMgHbOCa2F0yARLehkOafBMUo/IdCMMGmtJ6UmPU0hneEgWFpP4A1mIIgCpZT6/VUKxoAYIVlKgSJZCOZB/UYpFWtdqpsNnuUhqEgMpVgqLZYYChzNRCAdAZQCHesx1qoONowUMxAdGoNIrffeUEQprbQSkRrvvaUYrn5sfR1Lez12fpTW2oC42ShZRvPs+K1fMMM5N/FnTgpKntN+az7fH9beNaeF8ToDUUke2y/jkhljKbXGMJm4lsscQkW4DPdbbpH4KBINRCY5yUJ0nHPLWPDd6ygfomLMcp6Viqqqwq2cB9dlQsgQVpTNI1TdHYE2bNEYQzqXPaOQeLtMlZGqQiZqLqHq7d0NakKRzi/YFgxsdWIYayXn1tpEkFk1cVM/x76ULSJUVdWk6P90Kh+ge7LwxJBdg/yPtGyWlZ/a9gaC3mc+SXciMHSJIETchegD4q6fslx0l1Gn3v0grcdL3i47ifgBJi/TSTwtPn+WT9P8DRfPiHG+ML2H1ItBIH7I/kQWA8ObMm1uLiQ/FuOnvPmQHNnc800YHx4gJFIkcU9XVJNJiFIPnr1n1Kv3bmlay4crIQC4V8KpjADw8m77ojCCpmfEpZTw6oYoR4hHQldOAOi+jQPg8s0bXXuvGuDbZKg9CPWAgF16KKx9iGU/3YlYbrU+/u0pVvLiH1HQojh1oaWfAAAAAElFTkSuQmCC',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAABMCAMAAADugJGqAAAAgVBMVEVMaXF/TDeETDJvhpiTYEbKnHR/SjWQX1R/SDC4h2aSnKGnd1ewq6eETS+ESzOtqqTjvZWqqKOnqKasqqF7TUDtuYolVXxyQTMnKixVd5TWpnweGBMyNDTisINHPjg7ZYeCdWpqZF5UTkhmWk7Ys5GooZpfSDm/lXDyTmj7+/t8Y0z15nSeAAAAFHRSTlMA7n79+v7XCcL90fYuJkNiwoOHlJEjD8wAAAAJcEhZcwAACxMAAAsTAQCanBgAAAMMSURBVFiF7Zdtc6MgEIBjlKixSfrCAqGIRhu96///gTegQYlvaG/u0z3TmQywPN3FJWN2u//8I/aRhxWeF+237D9F2CI6rxUc8IDDaY1hj0dxLyccSaFNJHQ0eFMGjL3wpwbs5jjMGTA+bD7JFWd6xoucflaGQylnPEoS9EfnLUmkqD+K5gzhyPYA4xjASiNc9TgCjnEAANz1oRwGBghwAorEqZLTwBBDrarQ9ErxJhXeoAiAhwAg7a24HkRsdg8cU4rINlSlyqLdnXxX1XfsnEUlBWsQZa0EPH/MCFnNKk56VTaxGsaYzPPCTOglOaPY7T2MK8YEK/KGW7NJsNtjggntmFTsQko9wYS4PSib/AszoXKs5tozpDTmsRBFURRSyqIoWIFQzuRjWEj2jWJKZxUIQAgp1Z/6ZDeAmAkzFqwG5KBgms/PT8ZYDlD3x4y7KEoV3cAYAkhZb0LCoqJWiZstrFR90TkZiwHqBUUCALlOW2Vd6v7k0kzkKUCyoKAcII0LdR6iSHhLrhtOlHUKwOmSguovGI5qxHkKHCGEOKSc1wjxVN15uqygqXU909QeUxdFDDPEToqg+5dfLV0igZOCGoP83VIaB3VTxI/4SpaaqrLrWFZ4ZoNsMVLPUUETU/kvjTmdpA3YLSqo+dKMlcHkgKi7glq9YPcEpfTgoqAmjw7V2Q1nJwUdNFj7MOaT2PUV1LMS4U1PaWZfc2ifoLsdadoZvPkXpYOlUNdcXTP1aRTRwltjuI86Er23IU2auZW/CF7bu67reV23tyFUCsOr49t3y+Xo38da6+4fLzsHwuOVEHIdU+iF42I6x4xoRtK4NyvZcVbw4jdhhGRfz4avVk6I/zJteDNRQ0dnICR7mzJ89KKea7lba9nHuOHdNliO9hw6x/voOWRPYT3Hs4GQbOw8/EEYIX5jGF0aGo4jYa1jzEDI4NmGwzI01ykDyUKnJAgh2YR7mMaVrOZqGy7rDYRc3OqYw67EJxuwn2u2RWEfBtlCZnUF2US/M162Kfr35G8orptoFH8APszyAYOsq9UAAAAASUVORK5CYII=',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAABMCAMAAADugJGqAAAAe1BMVEVMaXE/Lyw6LiyVemhkUUZFMSuCZFdGMy49LitZQzo5Liw7Liyrk3vBoobck3XgqIzep45KMSz/27TJMwUyKyO2GyvRXjrmwqDwzarWt5f61a/ITU/afmyASECdQjnooId4KiUZFRGjLih1Z1nMRBu3NxDyT2n////j4uA6VmIVAAAAEXRSTlMA4Xf7+P4n973+U5z6/tONZun7sHoAAAAJcEhZcwAACxMAAAsTAQCanBgAAANfSURBVFiF7ZbbupsgEIVjlCA57F1Agigetslu+/5P2A9Q42gUkvay6yqS8LtmGGay2/1XiI6nNIqi6HTcvadDiugg/A7kEFGg/e5weI1wejjoZRaifTghmgNejihaI1CK9n9LoJSG+Eg3CRT7CcdtAqUnLwL7EF4bJx/Bnw288urJ53SbsH9OIOo8Kfc3jgPHSqrLw8jLceBYqZwVUpFhZfO2HBaA5KxUXjDGWK6SEMR+loJYKZmzXoVMAhAnYOAy2W+V21hQaDZv8/1G0n8iKaVt27YGkBc2A2MUDlG2rRfRCqNSqviWJLfeR24+x0rb70QYQoj6onSpe0RT6kZeOhGM6AhBrShF1wlhGaUQnXkmGamF6Ly5EKLKsizDFcoyIkrjwa4QYpeFqL2IziGcEpuY+rGAhZCxD6FFv+PrK8syoRttmfbJ+co9iLgQoieYXV3DmCDDU5ZVomGFB3Fh7q3uvcjks5y4MMnxI1gp0BB6ZdKpuzEVlUEGIIoxf0g0pjDHBCdCMj/ixiaM2pgwp2oPNCOWyM4eBFKOgbIM1WUurbRlmFQyxpS3LmhifqdFVYkyZ1IppSTToq660pZqEnLZc3cnS/vOIrc9a3i0192POLMNnX2DJLXd6tGlRo1LiW8kprYrjW2G/P7ldBvbD/bNopSCSBJys0qSaRzbbSt1k2PYcCG9LlMT2y08da03HnbEP60ez+77kx+BTH1ZaUPQw5PqBysOGALY3IWF5Dgu9wFzBMstAo0CEBQtCswexqBj0H8DooCFYSb7bKRgprqJbossh4QNGxFASCldeUs5M7FxKBF0IUctXKweCp7+iDBWFMaEGdALBA5EPLRArNmgIBAGJeOKIJ+NA0CYTgx05ZzXeNvGcRPRcKsRgv3/1mJIyO8OwXm1YSMBCFjiciRw3qE1G58w5Zc1Auff+Hnf+LxDBG8WeXgwnto43PkMwfUagfMaPcmG5h0gtHxk6AWhzym8sB+ctwDxzQfGMwLnJh1wNt75Ig6ja1GYinqiet7LP4YUDer6X97BUcxtTNvGdR7H2kZoY4L4wWdx2Ex4hMCQ/+DwPIYwNkVAYVyhCXOgflWgPK8gEyFR2PKCR9qODoKCMPoGxcn7xdDdTuB+vLZ10LSw/gXi+pYc4g+ZTtVtPFZT2AAAAABJRU5ErkJggg==',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAABMCAMAAADugJGqAAAAnFBMVEVMaXGWoqnkzKxthpmzp6Hpzqzy1K/41K+9trLKxceurKizpaGkqKqQk5vObGiMgYqysLW2FCavN0W2FCeSlJHPwLKdRkr/27QlVXwzLCTo4eFVeJW2FiciTnLuzqzjw6BZQzi1JTEeGhWASEGcODtFa4rEPkTehnlvYlXpn4na1dbOVFQyXX/0vZ/yT2nbxa6YeWb////ApYe9h3cx/At3AAAAF3RSTlMA0Gz9D7/w/v78TiiWef5E2XTC4N7i64IHUm8AAAAJcEhZcwAACxMAAAsTAQCanBgAAAL/SURBVFiF7ZbbsqIwEEWDoIAX9DgPnWC4RK4Cjo7//3FTSRBBVAJnqubl7Actolm1d3cHQOhHP/oPMrabzXqz2U7dv9nZbq3CWhsTAPZ9f00ZCzF2bk/2qDyrJwu1kREM4yXBdYuVMmInN9i2bQnZtl2IpZ0qYekWlnUxoSPzYlmFu1FEWMUFXupS2GqErWu9JgBY7lIJsbPfEQBstWrYb00AWGpJXP89wndVZnT7IQeAPVwM42vvnEyA2zXP8+tTY+GcOfvB8fqilFLmXPNb4Ae3LiJL+Y+/lBCU0hOYmZPViCyOo+tVANQQLAzDmJYsZpSdOaGkNGYpi8U63Q8htpRGhBAS8s+QlQBwEithSI5HElLqDPVknkqEVEgZo2ncXqDn+QBikVG543g8EkKoc8pYdL/iiBQWAwjTZPSOOBLCTgCMR5CXJOJ1HkJAVieRLs4AaUSkBUIIS0EBASVrokcpb2nrmrdIAWE+6sdzgMmL8SAMIhbQYsS8p7yroaylIA6Wc8b/ZJaCEad+IOQwzogkAWYDCDTjPsBhUcRSEyQCMhpHcSpGdTFIQAjJM1mWmTDk+/ygnMtSWgAFABLleKuhQkjNH/eoRs3S0HS3KipChO4fqby5cahUArWS5GEuFObjcqCHjVtY6zbSBHrYuP4Wuo41gdCqiZ5xQtYUR/3JjpooXSnH4Jo93/65h1EEhJa9AVuoPZFbMuYdI+Z8wisfmovTIQG+2lQ+ax4EgRzvIAgmIvyg0VQXAKbJTfA8kxDG48RyxLhqLjU9qfpvbEmia0qNNbQDxtjzem9LvudhjA/aoB0twUJe8ozQBQLjRPscQZcAbkPvEqyagDHWP8RZ1xYkI2mVw797kEbWbwnV41+c4R12guJbOm4TMK7WKgQsIJ5XVeKrQ3jHWLZSdCC9/SLLq3roeJT0PkEbR8C411vjRYzPSozvmsA9G4fxiEOXsBlPwHj53Rz4KYk+BdHtazIFkXQQ1RRE1UHgSWpPxmoaov2U/heIwyRJxF/Wd9oHF1ycIgAAAABJRU5ErkJggg==',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAABMCAMAAADugJGqAAAAbFBMVEVMaXE7Liw/LyyHbFVhTD6igWM5LizQUiRFMS09LitELiucORmAQizNRBfRaz/OVy3NSh9KMSztuYrJMwU0MS8uJRxuYFTUpn3hr4PEmXNLQTp+dGtbUkry8vLtz723Ng7XbEJxMB7q4NzcjXWNQ+3GAAAAEXRSTlMAjeH++v1d+vW9J/74/FBze2BVfYIAAAAJcEhZcwAACxMAAAsTAQCanBgAAAMLSURBVFiF7ZbbluIgEEU1gQhp7R6g5NZJ1J7//8dZkMQAxoDOmrc5LwrKzqmiCrLb/VeJmj2tqqqize49tZTdRd6BtBWLtN+17WuEPVtT9YKZapXwSkTVMwJjrPlrAiti0E0CI3lCs01wm5MTySHIe9v5UjYIy4q+lQlrcHEkdJVQG2XMMnw9jtoYzbkydp7Y7Jb2YT3CxijupA0qQTRJCmpjlOazFCpA7BMDwXrPGGMpzaZM13tGfkfoAnhc74RLEdZoU0uE5MTR7ntt3FdbhrCyA7CdrPGEULXsrAXoJJYFCHD/7OS3kwRbYyzBSj+WXWcBIIcAgO9A4NQFE7IEYWUg91TowhkAmUd0o6z7ApIrP+NHTmB1BlEDWC/3eGvBcC5hHvl5zDMIYwCAAQM4n906zTl2n27kp2ueRXB5XgTSVQUEM2eVRWCu2PJ/X02c22UG8yxCuq7GNfKrnAcn43wwVGNf9jiDYNODHUlxrry49qfOxMsXOIpa05j5yJmESppdhyu01jpt9zwCr7Z50O1NFoG2ECh3JVJ/KgXP9GlQgS+Su4uoPy+WFVgazo0MJrInH2WpDYQQSkxsH+F0unyiLQkG9fg7LTh+zXou50uRFCBIVE2z1P26bAouAaK2CKwqQLDHAgteD7Zs0PBCjRIy36dZGzS6U5fN0DombNioIoTrc9dm7jNFkDKEHk8LT0oRT22QCDH1uo+nY4U2SIq4S6aIZ/3KQnUhYujV5eNIsjbaCCFjxI9wCij7/KvWd4zoD54hPsiWjf1zxE/fn0aEEMcNGzRCqCEyMQYyGnlq4zNO+U9/Zwx93/9eEOJC1m18nmJE3w/zu9bQ90NAEOKybuMkYsRwFeJ0vV6vJyGuPCLMsSQ2DnOIk25iU8fHhv0S4hYhLtsI4dORhCHiODKE0XN4ln/NKZr1kUN4G2G/HtI4sgSfjcBFK5I4cplwinPx615ypWH4SMLCOMQmigjiGNXFKcpESRR+T8ItFQviVmbBVXlUnGKaLF09Kiqs15b+K8ThLY2L/wCifs4TfuPxmQAAAABJRU5ErkJggg==',
];
const randomFirstNames = [
    'Thomas',
    'Donald',
    'Raymond',
    'Joseph',
    'William',
    'Claude',
    'Robert',
    'Gary',
    'James',
    'Fernando',
    'Douglas',
];
const randomLastNames = [
    'Chatman',
    'Turner',
    'Lamy',
    'Hagee',
    'Ellis',
    'Davis',
    'Rittinger',
    'Yawn',
    'Hunter',
    'Grubbs',
    'Bunning',
];

type ListProps = {
    list: unknown[];
    showDoublesPlayers: boolean;
    showRankChanges: boolean;
    tournament: object;
    lineAfterId: number;
    lineLabel: React.ReactNode;
};

export const List = ({
    list,
    showDoublesPlayers,
    showRankChanges,
    tournament,
    lineAfterId = 0,
    lineLabel = 'Tournament Line',
}: ListProps) => {
    const { isOver, isBreak, isParticipation, playingAnotherFinal } = tournament;
    const currentUser = useSelector((state) => state.auth.user);
    const isDoublesTeam = tournament.levelType === 'doubles-team';
    const currentPlayerId = currentUser?.tournaments[tournament.id]?.playerId;

    const { projectedPlayers, projectedText } = useMemo(() => {
        const total = getTotalProjectedPlayers(tournament);
        if (total === 0 || isDoublesTeam) {
            return { projectedPlayers: [] };
        }

        const min = Math.floor(total / 5) * 5;
        const max = min + 5;
        const rest = total - Object.keys(tournament.players).length;

        return {
            projectedPlayers: new Array(rest).fill(0).map((_, index) => ({
                id: index + 90000,
                userId: index + 90000,
                firstName: randomFirstNames[Math.floor(Math.random() * randomFirstNames.length)],
                lastName: randomLastNames[Math.floor(Math.random() * randomLastNames.length)],
                avatar: randomAvatars[Math.floor(Math.random() * randomAvatars.length * 2)],
                matchesWon: 0,
                matchesLost: 0,
                points: 0,
                pointsChange: 0,
                rank: 1,
                isActive: 1,
            })),
            projectedText: (
                <div>
                    Based on other cities, we expect at least {min}-{max} players to join this ladder.
                </div>
            ),
        };
    }, [tournament]);

    const getIsMe = (player) =>
        Boolean(player && (currentUser?.id === player.userId || player.partnerIds?.includes(currentPlayerId)));

    return (
        <div>
            <table className="table tl-table" data-player-list>
                <thead>
                    <tr>
                        <th colSpan={2}>Rank</th>
                        <th className="ps-0 w-100">{isDoublesTeam ? 'Team' : 'Player'}</th>
                        <th className="d-none d-xl-table-cell">Matches</th>
                        <th className={classnames('text-nowrap', tournament.isOver && 'text-center')}>
                            <span className="d-none d-xl-inline">Win - Loss</span>
                            <span className="d-inline d-xl-none">W - L</span>
                        </th>
                        <th>Points</th>
                    </tr>
                </thead>
                <tbody>
                    {list.map((player, index) => {
                        const isMe = getIsMe(player);
                        const isFullDoublesTeam = Boolean(isDoublesTeam && player.partnerIds.length > 1);
                        const isCaptainAlone = isDoublesTeam && !isFullDoublesTeam;
                        const prevPlayer = list[index - 1];
                        const nextPlayer = list[index + 1];
                        const showCaptainAloneHeader =
                            isCaptainAlone && (index === 0 || prevPlayer.partnerIds.length > 1);
                        const showPartners = isDoublesTeam && showDoublesPlayers && player.partners.length > 1;
                        const showLine = lineAfterId === player.id;
                        const showTeamSeparator =
                            showPartners && nextPlayer && nextPlayer.partnerIds.length > 1 && !showLine;

                        return (
                            <Fragment key={`${player.id}-${index}`}>
                                {showCaptainAloneHeader && (
                                    <tr>
                                        <td colSpan="7">
                                            <h3 className={index === 0 ? 'mt-4' : 'mt-12'}>
                                                Captains Waiting for Teammates
                                            </h3>
                                        </td>
                                    </tr>
                                )}
                                <tr
                                    className={classnames(
                                        isMe && `table-primary tl-tr-top-round ${style.myself}`,
                                        isMe && (!isFullDoublesTeam || !showPartners) && 'tl-tr-bottom-round'
                                    )}
                                >
                                    <td className={style.value}>
                                        {player.rank}
                                        {!tournament.isOver && showRankChanges && player.rankChange !== 0 && (
                                            <span
                                                className={classnames(style.change, {
                                                    [style.up]: player.rankChange > 0,
                                                    [style.down]: player.rankChange < 0,
                                                })}
                                            >
                                                {player.rankChange > 0 ? '+' : ''}
                                                {player.rankChange}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className={style.avatar}>
                                            {(() => {
                                                if (isOver && !isBreak) {
                                                    return;
                                                }
                                                if (!isParticipation && !isBreak) {
                                                    return;
                                                }

                                                if (!player.isActive) {
                                                    return;
                                                }

                                                if (player.readyForFinal === 1) {
                                                    return (
                                                        <Tooltip
                                                            content="Registered for the Final Tournament"
                                                            offset={[0, 4]}
                                                        >
                                                            <div
                                                                className={style.participating}
                                                                data-final-available={player.id}
                                                            />
                                                        </Tooltip>
                                                    );
                                                }

                                                if (playingAnotherFinal[player.userId]) {
                                                    return (
                                                        <Tooltip
                                                            content={`Registered for the Final Tournament in ${
                                                                playingAnotherFinal[player.userId]
                                                            }`}
                                                            offset={[0, 4]}
                                                        >
                                                            <div
                                                                className={style.forbidden}
                                                                data-final-forbidden={player.id}
                                                            />
                                                        </Tooltip>
                                                    );
                                                }

                                                if (player.readyForFinal === 2) {
                                                    return (
                                                        <Tooltip
                                                            content="Skipping the Final Tournament"
                                                            offset={[0, 4]}
                                                        >
                                                            <div
                                                                className={style.skipping}
                                                                data-final-skipping={player.id}
                                                            />
                                                        </Tooltip>
                                                    );
                                                }

                                                if (
                                                    player.isStartingTlrTooHigh ||
                                                    player.isInitialTlrTooHigh ||
                                                    player.isProjectedTlrTooHigh
                                                ) {
                                                    return (
                                                        <Tooltip
                                                            content="Too strong for the Final Tournament"
                                                            offset={[0, 4]}
                                                        >
                                                            <div
                                                                className={style.tooStrong}
                                                                data-final-too-strong={player.id}
                                                            />
                                                        </Tooltip>
                                                    );
                                                }
                                            })()}
                                            <PlayerAvatar
                                                player1={player}
                                                className={classnames(isCaptainAlone && 'justify-content-end')}
                                            />
                                        </div>
                                    </td>
                                    <td
                                        className="ps-0 w-100 text-break"
                                        style={{ fontSize: '1rem', lineHeight: '1.3' }}
                                    >
                                        <div className="d-flex align-items-center">
                                            {isFullDoublesTeam ? (
                                                <Modal
                                                    title="Team Info"
                                                    hasForm={false}
                                                    renderTrigger={({ show }) => (
                                                        <a
                                                            href=""
                                                            className="fw-semibold"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                show();
                                                            }}
                                                        >
                                                            {player.partners[0].teamName}
                                                        </a>
                                                    )}
                                                    renderBody={({ hide }) => (
                                                        <TeamInfo captain={player} tournament={tournament} />
                                                    )}
                                                />
                                            ) : (
                                                <PlayerName player1={player} isLink />
                                            )}
                                            {(!player.isActive || player.hasBan) && (
                                                <Tooltip
                                                    content={
                                                        <div className="text-center">
                                                            {player.hasBan
                                                                ? 'Suspended due to numerous complaints'
                                                                : 'No longer available for matches.'}
                                                        </div>
                                                    }
                                                >
                                                    <span
                                                        className="svg-icon svg-icon-2 svg-icon-danger ms-2"
                                                        data-inactive-user={player.userId}
                                                    >
                                                        <StopIcon />
                                                    </span>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </td>
                                    <td
                                        className={classnames(
                                            'd-none d-xl-table-cell',
                                            tournament.isOver ? 'text-center text-nowrap' : style.value
                                        )}
                                    >
                                        {player.matchesWon + player.matchesLost}
                                        {!tournament.isOver &&
                                            (player.matchesWonChange > 0 || player.matchesLostChange > 0) && (
                                                <span className={style.change}>
                                                    +{player.matchesWonChange + player.matchesLostChange}
                                                </span>
                                            )}
                                    </td>
                                    <td className={tournament.isOver ? 'text-center text-nowrap' : style.value}>
                                        {player.matchesWon} - {player.matchesLost}
                                        {!tournament.isOver &&
                                            (player.matchesWonChange > 0 || player.matchesLostChange > 0) && (
                                                <span className={style.change}>
                                                    {player.matchesWonChange} - {player.matchesLostChange}
                                                </span>
                                            )}
                                    </td>
                                    <td className={tournament.isOver ? 'text-center text-nowrap' : style.value}>
                                        <span className={`badge badge-square badge-dark ${style.points}`}>
                                            {player.points}
                                        </span>
                                        {!tournament.isOver && player.pointsChange !== 0 && (
                                            <span className={style.change}>+{player.pointsChange}</span>
                                        )}
                                    </td>
                                </tr>
                                {showPartners && (
                                    <>
                                        <tr
                                            className={classnames(
                                                isMe && `table-primary tl-tr-bottom-round ${style.myself}`
                                            )}
                                        >
                                            <td colSpan={2} />
                                            <td className="ps-0 pt-0" colSpan="7">
                                                <div className={style.partners}>
                                                    {player.partners.map((partner) => (
                                                        <div key={partner.id} className={style.partner}>
                                                            <PlayerName player1={partner} isLink highlight={false} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                        {showTeamSeparator && (
                                            <tr>
                                                <td colSpan={7}>
                                                    <div className={style.teamSeparator} />
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                )}
                                {showLine && (
                                    <tr>
                                        <td colSpan="7">
                                            <div className={style.average}>
                                                <div />
                                                <div>{lineLabel}</div>
                                                <div />
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        );
                    })}
                </tbody>
            </table>

            {projectedPlayers.length > 0 && (
                <div className="position-relative overflow-hidden" data-projected-players>
                    <div className={style.projectedWrapper}>
                        <div className={style.projectedContent}>{projectedText}</div>
                    </div>
                    <table className="table tl-table" style={{ marginTop: '-3rem' }}>
                        <thead>
                            <tr>
                                <th colSpan={2}>Rank</th>
                                <th className="ps-0 w-100">Player</th>
                                <th className="d-none d-xl-table-cell">Matches</th>
                                <th className="text-nowrap">
                                    <span className="d-none d-xl-inline">Win - Loss</span>
                                    <span className="d-inline d-xl-none">W - L</span>
                                </th>
                                <th>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projectedPlayers.map((player) => (
                                <tr key={player.id}>
                                    <td className={style.value}>
                                        {player.rank}
                                        {!tournament.isOver && showRankChanges && player.rankChange !== 0 && (
                                            <span
                                                className={classnames(style.change, {
                                                    [style.up]: player.rankChange > 0,
                                                    [style.down]: player.rankChange < 0,
                                                })}
                                            >
                                                {player.rankChange > 0 ? '+' : ''}
                                                {player.rankChange}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className={style.avatar}>
                                            <PlayerAvatar player1={player} />
                                        </div>
                                    </td>
                                    <td
                                        className="ps-0 w-100 text-break"
                                        style={{ fontSize: '1rem', lineHeight: '1.3' }}
                                    >
                                        <Link to={`/player/${player.userSlug}`} className="fw-semibold">
                                            {player.firstName} {player.lastName}
                                        </Link>
                                    </td>
                                    <td className={classnames('d-none d-xl-table-cell')}>
                                        {player.matchesWon + player.matchesLost}
                                    </td>
                                    <td className={style.value}>
                                        {player.matchesWon} - {player.matchesLost}
                                    </td>
                                    <td className={style.value}>
                                        <span className={`badge badge-square badge-dark ${style.points}`}>
                                            {player.points}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

type PlayersByPointsProps = {
    tournament: object;
    showDoublesPlayers: boolean;
};

const PlayersByPoints = (props: PlayersByPointsProps) => {
    const { tournament, showDoublesPlayers } = props;

    const currentWeek = Math.ceil(dayjs.tz().diff(dayjs.tz(tournament.startDate), 'week', true));
    const showRankChanges = currentWeek > 2;

    const sortedPlayers = useMemo(
        () =>
            Object.values(tournament.players)
                .filter((player) => !player.hidden)
                .sort(
                    compareFields('stats.rank', 'stats.matches-desc', 'stats.matchesWon-desc', 'firstName', 'lastName')
                )
                .sort((a, b) => {
                    if (!a.partners || !b.partners) {
                        return 0;
                    }
                    if (a.partners.length > 1 && b.partners.length > 1) {
                        return 0;
                    }
                    return a.partners.length <= 1 ? 1 : -1;
                }),
        [tournament.players]
    );

    const list = sortedPlayers.map((player) => ({
        ...player,
        ...player.stats,
    }));

    // Show tournament line for the ended season if the next season is not started yet
    const lineProps = (() => {
        if (!tournament.isOver || !tournament.isBreak) {
            return {};
        }

        const lastFinalPlayer = sortedPlayers
            .filter((player) => player.readyForFinal === 1)
            .slice(tournament.totalFinalPlayers - 1);
        const lineAfterId = lastFinalPlayer.length > 0 ? lastFinalPlayer[0].id : 0;
        const lineLabel = <span>Top {tournament.totalFinalPlayers} Tournament Line</span>;

        return { lineAfterId, lineLabel };
    })();

    return (
        <List
            list={list}
            showDoublesPlayers={showDoublesPlayers}
            showRankChanges={showRankChanges}
            tournament={tournament}
            {...lineProps}
        />
    );
};

export default PlayersByPoints;
