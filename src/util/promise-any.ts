const promiseAny = <T>(iterable: Iterable<T | PromiseLike<T>>): Promise<T> => {
  if ('any' in Promise && typeof Promise.any === 'function') {
    return Promise.any(iterable)
  }

  return Promise.all(
    [...iterable].map(promise => {
      return new Promise((resolve, reject) =>
        Promise.resolve(promise).then(reject, resolve)
      )
    })
  ).then(
    errors => Promise.reject(errors),
    value => Promise.resolve<T>(value)
  )
}

export default promiseAny
